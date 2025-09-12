import React, { useState, useEffect, useRef } from 'react';
import styles from './MapPage.module.css';
import axios from 'axios';

const MapPage = () => {
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);   
  const dragStartY = useRef(null); 

  const dayMap = {
    Monday: '월', Tuesday: '화', Wednesday: '수',
    Thursday: '목', Friday: '금', Saturday: '토', Sunday: '일'
  };

  const parseMapCoord = (value) => {
    if (value === undefined || value === null) return null;
    const str = String(value).replace(/\D/g, ''); 
    if (!str || str.length < 8) return null;      
    const intPart = str.slice(0, str.length - 7);
    const decimalPart = str.slice(str.length - 7);
    const num = parseFloat(`${intPart}.${decimalPart}`);
    return Number.isFinite(num) ? num : null;
  };

  useEffect(() => {
    const loadMapScript = () =>
      new Promise((resolve, reject) => {
        if (window.naver?.maps) return resolve();
        const script = document.createElement('script');
        script.src = `${process.env.REACT_APP_NAVER_MAP_API}${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
        script.async = true;
        script.onload = () => {
          const timer = setInterval(() => {
            if (window.naver?.maps) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });

    const initMap = () => {
      if (!mapRef.current) return;
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.7380625, 127.0338935),
        zoom: 13,
      });
    };

    loadMapScript().then(initMap).catch((e) => {
      console.error('네이버 지도 스크립트 로드 실패:', e);
    });
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const addMarkers = (list) => {
    if (!window.naver || !mapInstance.current) return;
    clearMarkers();

    list.forEach((p) => {
      const lat = parseMapCoord(p.mapy) ?? parseFloat(p.lat);
      const lng = parseMapCoord(p.mapx) ?? parseFloat(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const markerHtml = `
        <div style="
          display:flex; flex-direction:column; align-items:center; pointer-events:auto;
        ">
          <div style="
            background-color:#BBD66F; width:18px; height:18px; border-radius:50%;
            border:2px solid #fff; box-shadow:0 0 4px rgba(0,0,0,.2);
          "></div>
          <div style="margin-top:4px; font-size:11px; color:#444; white-space:nowrap;">
            ${p.title ?? ''}
          </div>
        </div>
      `;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: mapInstance.current,
        icon: { content: markerHtml, anchor: new window.naver.maps.Point(9, 9) },
      });

      markersRef.current.push(marker);
    });

    if (list.length > 0) {
      const firstLat = parseMapCoord(list[0].mapy) ?? parseFloat(list[0].lat);
      const firstLng = parseMapCoord(list[0].mapx) ?? parseFloat(list[0].lng);
      if (Number.isFinite(firstLat) && Number.isFinite(firstLng)) {
        mapInstance.current.setCenter(new window.naver.maps.LatLng(firstLat, firstLng));
      }
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert('검색 키워드를 입력해 주세요.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/v1/places/search?keyword=${encodeURIComponent(keyword)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaces(data);
      setCollapsed(false); 
      addMarkers(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message ?? '네트워크/서버 오류가 발생했습니다.');
    }
  };

  const handleDragStart = (e) => {
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };
  const handleDragEnd = (e) => {
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const delta = endY - dragStartY.current;
    if (delta > 50) setCollapsed(true);   
    else if (delta < -50) setCollapsed(false); 
  };

  const handleHandleClick = (e) => {
    e.stopPropagation();
    setCollapsed((v) => !v);
  };

  const handlePlaceClick = (place) => {
    if (!mapInstance.current || !window.naver) return;
    const lat = parseMapCoord(place.mapy) ?? parseFloat(place.lat);
    const lng = parseMapCoord(place.mapx) ?? parseFloat(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapInstance.current.setCenter(new window.naver.maps.LatLng(lat, lng));
    mapInstance.current.setZoom(16, true);
    setCollapsed(true);
  };

  return (
    <div className={styles.mapPageContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="검색할 키워드를 입력하세요."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={styles.searchInput}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className={styles.searchButton}>
          <img src="/image/search-icon.png" alt="검색" className={styles.searchIcon} />
        </button>
      </div>

      <div ref={mapRef} className={styles.mapArea} />

      {places.length > 0 && (
        <div
          className={`${styles.placeListContainer} ${collapsed ? styles.placeListCollapsed : ''}`}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          <div className={styles.dragHandle} onClick={handleHandleClick} />
          {places.map((place, idx) => (
            <div
              key={`${place.placeId}-${idx}`}
              className={styles.placeItem}
              onClick={() => handlePlaceClick(place)}
            >
              <h3 className={styles.placeTitle}>{place.title}</h3>
              <p className={styles.placeAddress}>{place.address}</p>
              <p className={styles.placeAddress}>{place.roadAddress}</p>

              <div className={styles.holidayList}>
                {Array.isArray(place.holiday) && place.holiday.length > 0
                  ? place.holiday.map((line, i) => {
                      if (line === '정보 없음') {
                        return (
                          <p key={i} className={styles.holidayText}>
                            운영 시간 정보 없음
                          </p>
                        );
                      }
                      const [day, time = ''] = line.split(': ');
                      const ko = dayMap[day] ?? day;
                      return (
                        <p key={i} className={styles.holidayText}>
                          {ko} | {time}
                        </p>
                      );
                    })
                  : <p className={styles.holidayText}>운영 시간 정보 없음</p>}
              </div>

              {place.mapUrl && (
                <a
                  href={place.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.naverLink}
                  onClick={(e) => e.stopPropagation()} 
                >
                  네이버 지도로 이동
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapPage;
