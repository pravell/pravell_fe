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
  const myMarkerRef = useRef(null);
  const dragStartY = useRef(null);
  const centeredOnceRef = useRef(false);

  const dayMap = {
    Monday: '월', Tuesday: '화', Wednesday: '수',
    Thursday: '목', Friday: '금', Saturday: '토', Sunday: '일'
  };

  const parseMapCoord = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).replace(/\D/g, '');
    if (!s || s.length < 8) return null;
    const intPart = s.slice(0, s.length - 7);
    const decPart = s.slice(s.length - 7);
    const num = parseFloat(`${intPart}.${decPart}`);
    return Number.isFinite(num) ? num : null;
  };

  const flyTo = (lat, lng, zoom = 16) => {
    const map = mapInstance.current;
    const latlng = new window.naver.maps.LatLng(lat, lng);
    if (typeof map.morph === 'function') map.morph(latlng, zoom, { duration: 400 });
    else { map.setZoom(zoom); map.panTo(latlng); }
  };

  const locateMe = ({ initial = false } = {}) => {
    if (!navigator.geolocation || !mapInstance.current) {
      if (!initial) alert('위치 서비스를 사용할 수 없습니다.');
      return;
    }
    if (initial && centeredOnceRef.current) return;

    const SEC_COLOR =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--quaternary-color')
        .trim() || '#4563B0';

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const latlng = new window.naver.maps.LatLng(latitude, longitude);
        const myIcon = {
          content: `<div style="width:20px;height:20px;border-radius:50%;
                     background:${SEC_COLOR};border:3px solid #fff;
                     box-shadow:0 0 6px rgba(0,0,0,.25)"></div>`,
          anchor: new window.naver.maps.Point(10, 10),
        };

        if (myMarkerRef.current) {
          myMarkerRef.current.setPosition(latlng);
        } else {
          myMarkerRef.current = new window.naver.maps.Marker({
            position: latlng,
            map: mapInstance.current,
            icon: myIcon,
            zIndex: 999,
          });
        }

        flyTo(latitude, longitude, 17);
        centeredOnceRef.current = true;
      },
      () => {
        if (!initial) alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해 주세요.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const load = () => new Promise((resolve, reject) => {
      if (window.naver?.maps) return resolve();
      const script = document.createElement('script');
      script.src = `${process.env.REACT_APP_NAVER_MAP_API}${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
      script.async = true;
      script.onload = () => {
        const t = setInterval(() => {
          if (window.naver?.maps) { clearInterval(t); resolve(); }
        }, 100);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    const init = () => {
      if (!mapRef.current) return;
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.7380625, 127.0338935),
        zoom: 13,
      });
    };

    load()
      .then(() => {
        init();
        locateMe({ initial: true });
      })
      .catch(() => {});
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
        <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
          <div style="background:#93D3E7;width:18px;height:18px;border-radius:50%;
                       border:2px solid #EEF2BA;box-shadow:0 0 4px rgba(0,0,0,.2);"></div>
          <div style="margin-top:4px;font-size:11px;color:#444;white-space:nowrap;">
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
  };

  const handleSearch = async () => {
    if (!keyword.trim()) { alert('검색 키워드를 입력해 주세요.'); return; }
    const token = localStorage.getItem('accessToken');
    if (!token) { alert('로그인이 필요합니다.'); return; }

    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/v1/places/search?keyword=${encodeURIComponent(keyword)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaces(data);
      setCollapsed(false);
      addMarkers(data);

      if (data.length > 0) {
        const f = data[0];
        const lat = parseMapCoord(f.mapy) ?? parseFloat(f.lat);
        const lng = parseMapCoord(f.mapx) ?? parseFloat(f.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) flyTo(lat, lng, 15);
      }
    } catch (err) {
      alert(err.response?.data?.message ?? '네트워크/서버 오류가 발생했습니다.');
    }
  };

  const handleDragStart = (e) => { dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY; };
  const handleDragEnd = (e) => {
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const d = endY - dragStartY.current;
    if (d > 50) setCollapsed(true);
    else if (d < -50) setCollapsed(false);
  };

  const handleHandleClick = (e) => { e.stopPropagation(); setCollapsed((v) => !v); };

  const handlePlaceClick = (place) => {
    if (!mapInstance.current || !window.naver) return;
    const lat = parseMapCoord(place.mapy) ?? parseFloat(place.lat);
    const lng = parseMapCoord(place.mapx) ?? parseFloat(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    flyTo(lat, lng, 16);
    setCollapsed(true);
  };

  return (
    <div className={styles.mapPageContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="검색 할 키워드를 입력하세요."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={styles.searchInput}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className={styles.searchButton}>
          <img src="/image/search-icon.png" alt="검색" className={styles.searchIcon} />
        </button>
      </div>

      <button className={styles.locateButton} onClick={() => locateMe()} aria-label="내 위치로 이동">
        <img src="/image/target.png" alt="" className={styles.locateIcon} />
      </button>

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
                      if (line === '정보 없음') return <p key={i} className={styles.holidayText}>운영 시간 정보 없음</p>;
                      const [d, t = ''] = line.split(': ');
                      return <p key={i} className={styles.holidayText}>{dayMap[d] ?? d} | {t}</p>;
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
