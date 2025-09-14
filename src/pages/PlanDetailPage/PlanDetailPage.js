import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./PlanDetailPage.module.css";
import axios from "axios";
import usePlanData, { DEFAULT_LEGEND } from "./hooks/usePlanData";
import { parseMapCoord, flyTo } from "./utils/utils";

import PlaceList from "./components/PlaceList";
import PlaceDetail from "./components/PlaceDetail";
import LegendBox from "./components/LegendBox";

export default function PlanDetailPage() {
  const { planId } = useParams();

  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("places");
  const [collapsed, setCollapsed] = useState(true);
  const dragStartY = useRef(null);

  const {
    places,
    setPlaces,
    legend,
    setLegend,
    legendToShow,
    firstPlaceLatLng,
    replacePlace,
    removePlace,
  } = usePlanData(planId);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const myMarkerRef = useRef(null);
  const centeredOnce = useRef(false);

  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDL] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editingPlace, setEditingPlace] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    pinColor: "#93D3E7",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (myMarkerRef.current && mapInstance.current) {
      myMarkerRef.current.setMap(mapInstance.current);
      myMarkerRef.current.setZIndex(9999);
    }
  }, []);
  const addMarkers = useCallback(
    (list) => {
      if (!window.naver || !mapInstance.current) return;
      clearMarkers();
      list.forEach((p) => {
        const lat = Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy);
        const lng = Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const color = p.pinColor || p.pin_color || "#93D3E7";
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
      if (myMarkerRef.current && mapInstance.current) {
        myMarkerRef.current.setMap(mapInstance.current);
        myMarkerRef.current.setZIndex(9999);
      }
    },
    [clearMarkers]
  );

  useEffect(() => {
    if (places.length) addMarkers(places);
  }, [places, addMarkers]);

  useEffect(() => {
    if (firstPlaceLatLng && mapInstance.current) {
      flyTo(
        mapInstance.current,
        firstPlaceLatLng.lat,
        firstPlaceLatLng.lng,
        15
      );
    }
  }, [firstPlaceLatLng]);

  const locateMe = ({ initial = false } = {}) => {
    if (!navigator.geolocation || !mapInstance.current) {
      if (!initial) alert("위치 서비스를 사용할 수 없습니다.");
      return;
    }
    if (initial && centeredOnce.current) return;

    const color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--quinary-color")
        .trim() || "#4563B0";

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        const latlng = new window.naver.maps.LatLng(latitude, longitude);
        const myIcon = {
          content: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.25)"></div>`,
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
        flyTo(mapInstance.current, latitude, longitude, 17);
        centeredOnce.current = true;
      },
      () => {
        if (!initial)
          alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const detailAbortRef = useRef(null);
  const detailInflight = useRef(false);

  const handleSelectPlace = useCallback((p) => {
    const lat = Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy);
    const lng = Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx);
    if (Number.isFinite(lat) && Number.isFinite(lng) && mapInstance.current) {
      flyTo(mapInstance.current, lat, lng, 16);
    }
    setCollapsed(false);
    setDetailOpen(true);
    setDetail(null);
    setEditingPlace(false);
    setShowDeleteConfirm(false);
    setDetailId(p.id ?? p.placeId);
  }, []);

  useEffect(() => {
    if (!detailOpen || !detailId) return;
    if (detailInflight.current) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    detailInflight.current = true;
    setDL(true);
    detailAbortRef.current?.abort();
    detailAbortRef.current = new AbortController();

    axios
      .get(`${process.env.REACT_APP_API_URL}/v1/places/${detailId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: detailAbortRef.current.signal,
      })
      .then(({ data }) => setDetail(data))
      .catch((err) => {
        if (!axios.isCancel(err))
          alert(
            err.response?.data?.message ?? "장소 상세를 불러오지 못했습니다."
          );
      })
      .finally(() => {
        setDL(false);
        detailInflight.current = false;
      });
  }, [detailOpen, detailId]);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailId(null);
    setDetail(null);
  }, []);

  const savePlace = async () => {
    if (!detail) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    const payload = {};
    const nick = (form.nickname ?? "").trim();
    if (nick !== (detail.nickname ?? "")) {
      if (nick && (nick.length < 2 || nick.length > 30))
        return alert("nickname은 2~30자");
      payload.nickname = nick || null;
    }
    const pin = form.pinColor ?? "";
    const originalPin = detail.pin_color || detail.pinColor || "";
    if (pin !== originalPin) {
      if (pin && !/^#[0-9A-Fa-f]{6}$/.test(pin))
        return alert("올바르지 않은 pin color");
      payload.pinColor = pin || null;
    }
    const desc = (form.description ?? "").trim();
    if (desc !== (detail.description ?? "")) {
      if (desc && (desc.length < 2 || desc.length > 255))
        return alert("description은 2~255자");
      payload.description = desc || null;
    }
    if (!Object.keys(payload).length) {
      setEditingPlace(false);
      return;
    }

    try {
      setSaving(true);
      const { data } = await axios.patch(
        `${process.env.REACT_APP_API_URL}/v1/places/${detail.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const normalized = { ...data, pinColor: data.pin_color ?? data.pinColor };
      setDetail(normalized);
      replacePlace(normalized);
      addMarkers(
        places.length
          ? places.map((p) =>
              p.id === normalized.id ? { ...p, ...normalized } : p
            )
          : []
      );
      setEditingPlace(false);
    } catch (e) {
      alert(e.response?.data?.message ?? "장소 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = async () => {
    if (!detail) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");
    try {
      setDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API_URL}/v1/places`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { placeId: [detail.id] },
      });
      removePlace(detail.id);
      setDetailOpen(false);
      setDetail(null);
      addMarkers(places.filter((p) => p.id !== detail.id));
    } catch (e) {
      alert(e.response?.data?.message ?? "장소 삭제 실패");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    if (!editingPlace || !detail) return;
    setForm({
      nickname: detail.nickname ?? "",
      pinColor: detail.pin_color || detail.pinColor || "#93D3E7",
      description: detail.description ?? "",
    });
  }, [editingPlace, detail]);

  const onDragStart = (e) => {
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };
  const onDragEnd = (e) => {
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const d = endY - dragStartY.current;
    if (d > 50) setCollapsed(true);
    else if (d < -50) setCollapsed(false);
  };

  return (
    <div className={styles.container}>
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

      <button
        className={styles.locateButton}
        onClick={() => locateMe()}
        aria-label="내 위치로 이동"
      >
        <img src="/image/target.png" alt="" className={styles.locateIcon} />
      </button>

      <div ref={mapRef} className={styles.map} />

      <LegendBox planId={planId} legend={legend} setLegend={setLegend} />

      <div
        className={`${styles.sheet} ${collapsed ? styles.sheetCollapsed : ""}`}
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
      >
        <div
          className={styles.sheetHandle}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((v) => !v);
          }}
        />

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
          !detailOpen ? (
            <PlaceList
              places={places}
              keyword={keyword}
              onSelect={handleSelectPlace}
            />
          ) : (
            <PlaceDetail
              detail={detail}
              loading={detailLoading}
              onBack={closeDetail}
              onFlyTo={() => {
                if (!detail || !mapInstance.current) return;
                const lat = Number.isFinite(detail.lat)
                  ? detail.lat
                  : parseMapCoord(detail.mapy);
                const lng = Number.isFinite(detail.lng)
                  ? detail.lng
                  : parseMapCoord(detail.mapx);
                if (Number.isFinite(lat) && Number.isFinite(lng))
                  flyTo(mapInstance.current, lat, lng, 17);
              }}
              editing={editingPlace}
              setEditing={setEditingPlace}
              showDeleteConfirm={showDeleteConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              form={form}
              setForm={setForm}
              onSave={savePlace}
              saving={saving}
              onDelete={deletePlace}
              deleting={deleting}
            />
          )
        ) : (
          <div className={styles.routePlaceholder}>
            루트 기능은 준비 중입니다.
          </div>
        )}
      </div>
    </div>
  );
}
