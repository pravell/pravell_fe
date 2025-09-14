import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./PlanDetailPage.module.css";
import axios from "axios";

const dayKo = {
  Monday: "월",
  Tuesday: "화",
  Wednesday: "수",
  Thursday: "목",
  Friday: "금",
  Saturday: "토",
  Sunday: "일",
};

const DEFAULT_LEGEND = [{ color: "#C0D86E", description: "저장된 장소" }];

const parseMapCoord = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/\D/g, "");
  if (!s || s.length < 8) return null;
  const intPart = s.slice(0, s.length - 7);
  const decPart = s.slice(s.length - 7);
  const num = parseFloat(`${intPart}.${decPart}`);
  return Number.isFinite(num) ? num : null;
};

const flyTo = (map, lat, lng, zoom = 16) => {
  const latlng = new window.naver.maps.LatLng(lat, lng);
  if (typeof map.morph === "function")
    map.morph(latlng, zoom, { duration: 400 });
  else {
    map.setZoom(zoom);
    map.panTo(latlng);
  }
};

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  const firstArray = Object.values(data || {}).find(Array.isArray);
  return firstArray || [];
};

const PlanDetailPage = () => {
  const { planId } = useParams();

  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("places");
  const [collapsed, setCollapsed] = useState(true);
  const [places, setPlaces] = useState([]);
  const [legend, setLegend] = useState([]);

  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [newColor, setNewColor] = useState("#C0D86E");
  const [newDesc, setNewDesc] = useState("");
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editColor, setEditColor] = useState("#C0D86E");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [editingPlace, setEditingPlace] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editPinColor, setEditPinColor] = useState("#93D3E7");
  const [editDescription, setEditDescription] = useState("");
  const [updatingPlace, setUpdatingPlace] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPlace, setDeletingPlace] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const myMarkerRef = useRef(null);
  const dragStartY = useRef(null);
  const centeredOnceRef = useRef(false);

  const filteredPlaces = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => {
      const name = (p.nickname || p.title || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      const raddr = (p.roadAddress || p.roadAddredd || "").toLowerCase();
      return name.includes(q) || addr.includes(q) || raddr.includes(q);
    });
  }, [keyword, places]);

  const ensureMyMarkerOnTop = () => {
    if (!myMarkerRef.current || !mapInstance.current) return;
    myMarkerRef.current.setMap(mapInstance.current);
    myMarkerRef.current.setZIndex(9999);
  };

  const locateMe = ({ initial = false } = {}) => {
    if (!navigator.geolocation || !mapInstance.current) {
      if (!initial) alert("위치 서비스를 사용할 수 없습니다.");
      return;
    }
    if (initial && centeredOnceRef.current) return;

    const color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--quinary-color")
        .trim() || "#4563B0";

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const latlng = new window.naver.maps.LatLng(latitude, longitude);
        const myIcon = {
          content: `<div style="width:20px;height:20px;border-radius:50%;
                     background:${color};border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.25)"></div>`,
          anchor: new window.naver.maps.Point(10, 10),
        };
        if (myMarkerRef.current) {
          myMarkerRef.current.setPosition(latlng);
          myMarkerRef.current.setIcon(myIcon);
        } else {
          myMarkerRef.current = new window.naver.maps.Marker({
            position: latlng,
            map: mapInstance.current,
            icon: myIcon,
            zIndex: 9999,
          });
        }
        ensureMyMarkerOnTop();
        flyTo(mapInstance.current, latitude, longitude, 17);
        centeredOnceRef.current = true;
      },
      () => {
        if (!initial)
          alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const load = () =>
      new Promise((resolve, reject) => {
        if (window.naver?.maps) return resolve();
        const script = document.createElement("script");
        script.src = `${process.env.REACT_APP_NAVER_MAP_API}${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
        script.async = true;
        script.onload = () => {
          const t = setInterval(() => {
            if (window.naver?.maps) {
              clearInterval(t);
              resolve();
            }
          }, 100);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });

    const init = () => {
      if (!mapRef.current) return;
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 12,
      });
      setTimeout(() => locateMe({ initial: true }), 0);
    };

    load()
      .then(init)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !planId) return;

    const headers = { Authorization: `Bearer ${token}` };
    const fetchPlaces = axios.get(
      `${process.env.REACT_APP_API_URL}/v1/places/plan/${planId}`,
      { headers }
    );
    const fetchLegend = axios.get(
      `${process.env.REACT_APP_API_URL}/v1/markers/${planId}`,
      { headers }
    );

    Promise.all([fetchPlaces, fetchLegend])
      .then(([placesRes, legendRes]) => {
        const placeList = normalizeArray(placesRes.data);
        const legendList = normalizeArray(legendRes.data);
        setPlaces(placeList);
        setLegend(Array.isArray(legendList) ? legendList : []);
        addMarkers(placeList);
        if (placeList.length) {
          const f = placeList[0];
          const lat = Number.isFinite(f.lat) ? f.lat : parseMapCoord(f.mapy);
          const lng = Number.isFinite(f.lng) ? f.lng : parseMapCoord(f.mapx);
          if (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            mapInstance.current
          ) {
            flyTo(mapInstance.current, lat, lng, 15);
          }
        }
      })
      .catch(() => {});
  }, [planId]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    ensureMyMarkerOnTop();
  };

  const addMarkers = (list) => {
    if (!window.naver || !mapInstance.current) return;
    clearMarkers();
    list.forEach((p) => {
      const lat = Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy);
      const lng = Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = p.pinColor || "#93D3E7";
      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
          <div style="background:${color};width:18px;height:18px;border-radius:50%;
                      border:2px solid #EEF2BA;box-shadow:0 0 4px rgba(0,0,0,.2);"></div>
          <div style="margin-top:4px;font-size:11px;color:#444;white-space:nowrap;">
            ${(p.nickname || p.title || "")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}
          </div>
        </div>`;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: mapInstance.current,
        icon: {
          content: markerHtml,
          anchor: new window.naver.maps.Point(9, 9),
        },
        zIndex: 100,
      });
      markersRef.current.push(marker);
    });
    ensureMyMarkerOnTop();
  };

  const openPlaceDetail = async (p) => {
    if (!mapInstance.current) return;

    const lat = Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy);
    const lng = Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      flyTo(mapInstance.current, lat, lng, 16);
    }
    setCollapsed(false);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setEditingPlace(false);
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const placeId = p.id ?? p.placeId;
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/v1/places/${placeId}`,
        { headers }
      );
      setDetail(data);
    } catch (err) {
      alert(
        err.response?.data?.message ?? "장소 상세 정보를 불러오지 못했습니다."
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closePlaceDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  const handleDragStart = (e) => {
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };
  const handleDragEnd = (e) => {
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const d = endY - dragStartY.current;
    if (d > 50) setCollapsed(true);
    else if (d < -50) setCollapsed(false);
  };
  const toggleSheet = (e) => {
    e.stopPropagation();
    setCollapsed((v) => !v);
  };

  const legendToShow = useMemo(
    () =>
      legend && legend.length ? [...DEFAULT_LEGEND, ...legend] : DEFAULT_LEGEND,
    [legend]
  );

  // 새 마커 생성
  const handleCreateMarker = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const hex = newColor.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      alert("올바른 HEX 색상 코드를 입력해 주세요. 예) #61EB52");
      return;
    }
    const desc = newDesc.trim();
    if (desc.length < 2 || desc.length > 30) {
      alert("설명은 2~30자로 입력해 주세요.");
      return;
    }
    try {
      setPosting(true);
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/v1/markers`,
        { planId, color: hex, description: desc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLegend((prev) => [...prev, data]);
      setShowMarkerForm(false);
      setNewDesc("");
    } catch (err) {
      alert(err.response?.data?.message ?? "마커 생성 중 오류가 발생했습니다.");
    } finally {
      setPosting(false);
    }
  };

  // 롱프레스/우클릭 편집 진입
  const longPressTimers = useRef({});
  const LONG_PRESS_MS = 600;

  const attachPressHandlers = (item) => {
    const id = item.markerId ?? item.id;
    const editable = !!id;

    const start = () => {
      if (!editable) return;
      longPressTimers.current[id] = setTimeout(() => {
        setEditingId(id);
        setEditColor(item.color || "#61EB52");
        setEditDesc(item.description || "");
      }, LONG_PRESS_MS);
    };
    const cancel = () => {
      const t = longPressTimers.current[id];
      if (t) {
        clearTimeout(t);
        delete longPressTimers.current[id];
      }
    };

    return {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onContextMenu: (e) => {
        if (!editable) return;
        e.preventDefault();
        setEditingId(id);
        setEditColor(item.color || "#61EB52");
        setEditDesc(item.description || "");
      },
    };
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const hex = editColor.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      alert("올바른 HEX 색상 코드 형식이 아닙니다.");
      return;
    }
    const desc = editDesc.trim();
    if (desc.length < 2 || desc.length > 30) {
      alert("설명은 2~30자로 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/v1/markers/${editingId}`,
        { color: hex, description: desc },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setLegend((prev) =>
        prev.map((m) =>
          (m.markerId ?? m.id) === editingId
            ? { ...m, color: hex, description: desc }
            : m
        )
      );
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message ?? "마커 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMarker = async () => {
    if (!editingId) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/v1/markers/${editingId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setLegend((prev) =>
        prev.filter((m) => (m.markerId ?? m.id) !== editingId)
      );
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message ?? "마커 삭제 중 오류가 발생했습니다.");
    }
  };

  const startEditPlace = () => {
    if (!detail) return;
    setEditingPlace(true);
    setEditNickname(detail.nickname ?? "");
    setEditPinColor(detail.pin_color || detail.pinColor || "#93D3E7");
    setEditDescription(detail.description ?? "");
  };

  const savePlacePatch = async () => {
    if (!detail) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 변경된 값만 보냄
    const payload = {};
    if ((editNickname ?? "") !== (detail.nickname ?? "")) {
      const v = editNickname.trim();
      payload.nickname = v === "" ? null : v;
      if (
        payload.nickname &&
        (payload.nickname.length < 2 || payload.nickname.length > 30)
      ) {
        alert("nickname은 2~30자여야 합니다.");
        return;
      }
    }
    const originalPin = detail.pin_color || detail.pinColor || "";
    if ((editPinColor ?? "") !== originalPin) {
      if (editPinColor && !/^#[0-9A-Fa-f]{6}$/.test(editPinColor)) {
        alert("올바르지 않은 pin color입니다.");
        return;
      }
      payload.pinColor = editPinColor || null;
    }
    if ((editDescription ?? "") !== (detail.description ?? "")) {
      const v = (editDescription ?? "").trim();
      payload.description = v === "" ? null : v;
      if (
        payload.description &&
        (payload.description.length < 2 || payload.description.length > 255)
      ) {
        alert("description은 2~255자여야 합니다.");
        return;
      }
    }
    if (Object.keys(payload).length === 0) {
      setEditingPlace(false);
      return;
    }

    try {
      setUpdatingPlace(true);
      const { data } = await axios.patch(
        `${process.env.REACT_APP_API_URL}/v1/places/${detail.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // API가 pin_color로 줄 수도 있어 매핑 정리
      const normalized = { ...data, pinColor: data.pin_color ?? data.pinColor };
      setDetail(normalized);

      // 목록 동기화
      setPlaces((prev) =>
        prev.map((p) => (p.id === normalized.id ? { ...p, ...normalized } : p))
      );

      // 마커 색상 바뀌었을 수 있으니 갱신
      addMarkers((prev) => (Array.isArray(prev) ? prev : places));
      setEditingPlace(false);
    } catch (err) {
      alert(err.response?.data?.message ?? "장소 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingPlace(false);
    }
  };

  // 삭제 확정 (DELETE /v1/places)
  const deletePlace = async () => {
    if (!detail) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setDeletingPlace(true);
      // 서버 명세에 맞게 body로 placeId 배열 전송
      await axios.delete(`${process.env.REACT_APP_API_URL}/v1/places`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { placeId: [detail.id] },
      });

      // 목록/마커/상세 닫기
      setPlaces((prev) => prev.filter((p) => p.id !== detail.id));
      setDetailOpen(false);
      setDetail(null);
      addMarkers((prev) => (Array.isArray(prev) ? prev : places));
    } catch (err) {
      alert(err.response?.data?.message ?? "장소 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingPlace(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 검색바 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색 할 키워드를 입력하세요."
          className={styles.searchInput}
        />
        <img
          src="/image/search-icon.png"
          alt="검색"
          className={styles.searchIcon}
        />
      </div>

      {/* 내 위치 */}
      <button
        className={styles.locateButton}
        onClick={() => locateMe()}
        aria-label="내 위치로 이동"
      >
        <img src="/image/target.png" alt="" className={styles.locateIcon} />
      </button>

      {/* 지도 */}
      <div ref={mapRef} className={styles.map} />

      {/* 범례 (+ 포함) */}
      <div className={styles.legend}>
        <div className={styles.legendHeader}>
          <button
            className={styles.legendPlus}
            onClick={() => setShowMarkerForm((v) => !v)}
            aria-label="마커 범례 추가"
          >
            +
          </button>
        </div>

        {showMarkerForm && (
          <form className={styles.legendForm} onSubmit={handleCreateMarker}>
            <div className={styles.legendFormRow}>
              <input
                type="color"
                className={styles.legendColorPicker}
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
              <input
                type="text"
                className={styles.legendColorInput}
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#C0D86E"
                maxLength={7}
              />
            </div>
            <div className={styles.legendFormRow}>
              <input
                type="text"
                className={styles.legendDescInput}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="설명"
                maxLength={30}
              />
            </div>
            <div className={styles.legendFormBtns}>
              <button
                type="button"
                className={styles.legendCancelBtn}
                onClick={() => setShowMarkerForm(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.legendSaveBtn}
                disabled={posting}
              >
                {posting ? "추가 중..." : "추가"}
              </button>
            </div>
            <div className={styles.legendDivider} />
          </form>
        )}

        {legendToShow.map((item, i) => {
          const id = item.markerId ?? item.id;
          const isEditing = editingId && id === editingId;

          return (
            <div key={i} className={styles.legendItemWrap}>
              <div
                className={`${styles.legendItem} ${
                  id ? styles.legendItemEditable : ""
                }`}
                {...attachPressHandlers(item)}
                title={id ? "꾹 눌러 편집 / 삭제" : undefined}
              >
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles.legendText}>{item.description}</span>
              </div>

              {isEditing && (
                <div className={styles.legendEditRow}>
                  <div className={styles.legendFormRow}>
                    <input
                      type="color"
                      className={styles.legendColorPicker}
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.legendColorInput}
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      maxLength={7}
                    />
                  </div>
                  <div className={styles.legendFormRow}>
                    <input
                      type="text"
                      className={styles.legendDescInput}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={30}
                    />
                  </div>
                  <div className={styles.legendEditBtns}>
                    <button
                      className={styles.legendDelBtn}
                      type="button"
                      onClick={deleteMarker}
                    >
                      삭제
                    </button>
                    <div className={styles.legendEditSpacer} />
                    <button
                      className={styles.legendCancelBtn}
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </button>
                    <button
                      className={styles.legendSaveBtn}
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      {saving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                  <div className={styles.legendDivider} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 시트 */}
      <div
        className={`${styles.sheet} ${collapsed ? styles.sheetCollapsed : ""}`}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div className={styles.sheetHandle} onClick={toggleSheet} />

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "places" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("places")}
          >
            저장된 장소
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "route" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("route")}
          >
            루트
          </button>
        </div>

        {activeTab === "places" ? (
          <>
            {!detailOpen ? (
              <div className={styles.list}>
                {filteredPlaces.map((p) => {
                  const displayName = p.nickname || p.title || "";
                  const road = p.roadAddress || p.roadAddredd || "";
                  return (
                    <div
                      key={p.id}
                      className={styles.item}
                      onClick={() => openPlaceDetail(p)}
                    >
                      <div className={styles.itemHeader}>
                        <h3 className={styles.itemTitle}>{displayName}</h3>
                        {p.mapUrl && (
                          <a
                            href={p.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.naverLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            네이버 지도로 이동
                          </a>
                        )}
                      </div>

                      {p.address && (
                        <div className={styles.row}>
                          <span className={styles.rowLabel}>주소</span>
                          <span className={styles.rowValue}>{p.address}</span>
                        </div>
                      )}
                      {road && (
                        <div className={styles.row}>
                          <span className={styles.rowLabel}>도로명 주소</span>
                          <span className={styles.rowValue}>{road}</span>
                        </div>
                      )}

                      {Array.isArray(p.hours) && p.hours.length > 0 && (
                        <div className={styles.hoursBlock}>
                          <div className={styles.rowLabel}>영업 시간</div>
                          <div className={styles.hoursList}>
                            {p.hours.map((h, i) => {
                              if (h === "정보 없음")
                                return (
                                  <div key={i} className={styles.hourLine}>
                                    정보 없음
                                  </div>
                                );
                              const [d, t = ""] = String(h).split(": ");
                              return (
                                <div key={i} className={styles.hourLine}>
                                  <span className={styles.hourDay}>
                                    {dayKo[d] ?? d}
                                  </span>
                                  <span className={styles.hourTime}>{t}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {p.memo && <div className={styles.memo}>{p.memo}</div>}
                    </div>
                  );
                })}
                {filteredPlaces.length === 0 && (
                  <div className={styles.empty}>저장된 장소가 없습니다.</div>
                )}
              </div>
            ) : (
              <div className={styles.detail}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailHeaderRow}>
                    <button
                      className={styles.detailBackBtn}
                      onClick={closePlaceDetail}
                      aria-label="뒤로"
                    >
                      ‹
                    </button>

                    {!editingPlace && (
                      <div className={styles.detailActions}>
                        <button
                          className={styles.textBtn}
                          onClick={startEditPlace}
                        >
                          수정
                        </button>
                        <button
                          className={styles.textBtnDanger}
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>

                </div>
                <h3 className={styles.detailTitle}>
                    {detail?.nickname || detail?.title || "장소 상세"}
                  </h3>

                {showDeleteConfirm && (
                  <div className={styles.inlineConfirm}>
                    <span>정말 삭제할까요?</span>
                    <div className={styles.inlineConfirmBtns}>
                      <button
                        className={styles.legendCancelBtn}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        취소
                      </button>
                      <button
                        className={styles.legendDelBtn}
                        onClick={deletePlace}
                        disabled={deletingPlace}
                      >
                        {deletingPlace ? "삭제 중…" : "삭제"}
                      </button>
                    </div>
                  </div>
                )}

                {editingPlace && (
                  <div className={styles.detailEditForm}>
                    <div className={styles.editRow}>
                      <label className={styles.rowLabel}>별칭</label>
                      <input
                        type="text"
                        className={styles.rowValueInput}
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="별칭 (선택)"
                        maxLength={30}
                      />
                    </div>

                    <div className={styles.editRow}>
                      <label className={styles.rowLabel}>핀 색상</label>
                      <div className={styles.colorRow}>
                        <input
                          type="color"
                          className={styles.legendColorPicker}
                          value={editPinColor}
                          onChange={(e) => setEditPinColor(e.target.value)}
                        />
                        <input
                          type="text"
                          className={styles.legendColorInput}
                          value={editPinColor}
                          onChange={(e) => setEditPinColor(e.target.value)}
                          maxLength={7}
                        />
                      </div>
                    </div>

                    <div className={styles.editRow}>
                      <label className={styles.rowLabel}>메모</label>
                      <textarea
                        rows={3}
                        className={styles.descTextarea}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        maxLength={255}
                        placeholder="설명 (선택)"
                      />
                    </div>

                    <div className={styles.legendFormBtns}>
                      <button
                        className={styles.legendCancelBtn}
                        type="button"
                        onClick={() => setEditingPlace(false)}
                      >
                        취소
                      </button>
                      <button
                        className={styles.legendSaveBtn}
                        type="button"
                        onClick={savePlacePatch}
                        disabled={updatingPlace}
                      >
                        {updatingPlace ? "저장 중…" : "저장"}
                      </button>
                    </div>

                    <div className={styles.legendDivider} />
                  </div>
                )}

                {detailLoading && (
                  <div className={styles.empty}>불러오는 중…</div>
                )}

                {!detailLoading && detail && (
                  <>
                    {(detail.address ||
                      detail.roadAddress ||
                      detail.roadAddredd) && (
                      <>
                        {detail.address && (
                          <div className={styles.row}>
                            <span className={styles.rowLabel}>주소</span>
                            <span className={styles.rowValue}>
                              {detail.address}
                            </span>
                          </div>
                        )}
                        {(detail.roadAddress || detail.roadAddredd) && (
                          <div className={styles.row}>
                            <span className={styles.rowLabel}>도로명 주소</span>
                            <span className={styles.rowValue}>
                              {detail.roadAddress || detail.roadAddredd}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {Array.isArray(detail.hours) && detail.hours.length > 0 && (
                      <div className={styles.hoursBlock}>
                        <div className={styles.rowLabel}>영업 시간</div>
                        <div className={styles.hoursList}>
                          {detail.hours.map((h, i) => {
                            if (h === "정보 없음")
                              return (
                                <div key={i} className={styles.hourLine}>
                                  정보 없음
                                </div>
                              );
                            const [d, t = ""] = String(h).split(": ");
                            return (
                              <div key={i} className={styles.hourLine}>
                                <span className={styles.hourDay}>
                                  {dayKo[d] ?? d}
                                </span>
                                <span className={styles.hourTime}>{t}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {detail.description && (
                      <div className={styles.memo}>{detail.description}</div>
                    )}

                    {Number.isFinite(
                      detail.lat ?? parseMapCoord(detail.mapy)
                    ) &&
                      Number.isFinite(
                        detail.lng ?? parseMapCoord(detail.mapx)
                      ) && (
                        <div style={{ marginTop: 12 }}>
                          <button
                            className={styles.legendSaveBtn}
                            onClick={() => {
                              const lat = Number.isFinite(detail.lat)
                                ? detail.lat
                                : parseMapCoord(detail.mapy);
                              const lng = Number.isFinite(detail.lng)
                                ? detail.lng
                                : parseMapCoord(detail.mapx);
                              flyTo(mapInstance.current, lat, lng, 17);
                            }}
                          >
                            지도에서 보기
                          </button>
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.routePlaceholder}>
            루트 기능은 준비 중입니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanDetailPage;
