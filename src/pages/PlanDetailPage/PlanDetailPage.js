import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { useLocation, useNavigate, useParams } from "react-router-dom";
  import styles from "./PlanDetailPage.module.css";
  
  import usePlanData from "./hooks/usePlanData";
  import useMapAndMarkers from "./hooks/useMapAndMarkers";
  import usePlanTitle from "./hooks/usePlanTitle";
  import useRoutes from "./hooks/useRoutes";
  
  import { parseMapCoord, flyTo } from "./utils/utils";
  
  import PlanDetailHeader from "./components/PlanDetailHeader";
  import SearchBar from "./components/SearchBar";
  import LegendBox from "./components/LegendBox";
  import PlaceList from "./components/PlaceList";
  import PlaceDetail from "./components/PlaceDetail";
  import SearchResultList from "./components/SearchResultList";
  import RouteList from "./components/RouteList";
  import CreateRouteModal from "./components/CreateRouteModal";
  
  import RouteDetail from "./components/RouteDetail";
  
  import {
    getAccessToken,
    getPlan,
    getPlanPlaces,
    getPlaceDetail,
    searchPlaces as apiSearchPlaces,
    savePlaceToPlan,
    patchPlace,
    deletePlaces,
    parseApiError,
    getRoutePlaces,
  } from "../../services/api";
  
  export default function PlanDetailPage() {
    const { planId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
  
    const initialTitle =
      location.state?.planTitle || location.state?.planName || "플랜 상세";
  
    const { planTitle, fetchPlanTitle } = usePlanTitle({
      planId,
      initialTitle,
      navigate,
    });
  
    const [keyword, setKeyword] = useState("");
    const [activeTab, setActiveTab] = useState("places");
    const [collapsed, setCollapsed] = useState(true);
    const handleRef = useRef(null);
    const dragStartY = useRef(0);
    const draggingRef = useRef(false);
    const draggedDYRef = useRef(0);
  
    const {
      places,
      setPlaces,
      legend,
      setLegend,
      firstPlaceLatLng,
      replacePlace,
    } = usePlanData(planId);
    const { mapRef, mapInstance, addMarkers, locateMe } = useMapAndMarkers();
  
    const {
      routes,
      loadRoutes,
      create: createRoute,
      creating,
    } = useRoutes(planId, navigate);
    const [openCreate, setOpenCreate] = useState(false);
  
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
  
    const [searchResults, setSearchResults] = useState([]);
    const [savingSearchId, setSavingSearchId] = useState(null);
  
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routePlaces, setRoutePlaces] = useState([]);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeDate, setRouteDate] = useState("");
    const routeOverlaysRef = useRef({ markers: [], arrows: [], line: null });
  
    const [canEdit, setCanEdit] = useState(false);
  
    const pinHEX = /^#[0-9A-F]{6}$/i;
  
    const pinColorOptions = useMemo(() => {
      let primaryHex = "";
      if (typeof window !== "undefined") {
        primaryHex = getComputedStyle(document.documentElement)
          .getPropertyValue("--primary-color")
          .trim();
      }
      const hasPrimary = pinHEX.test(primaryHex);
  
      const legendHexes = (legend || [])
        .map((l) => String(l?.color || "").trim())
        .filter((c) => pinHEX.test(c))
        .map((c) => c.toUpperCase());
  
      if (legendHexes.length === 0) {
        return hasPrimary ? [primaryHex.toUpperCase()] : [];
      }
  
      const ordered = hasPrimary
        ? [primaryHex.toUpperCase(), ...legendHexes]
        : legendHexes;
  
      return Array.from(new Set(ordered));
    }, [legend]);
  
    const refreshPlanPlaces = useCallback(async () => {
      const token = getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      try {
        const { data } = await getPlanPlaces(planId, token);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setPlaces(
          list.map((p) => ({
            ...p,
            lat: Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy),
            lng: Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx),
          }))
        );
        if (list.length) addMarkers(list, { onClick: handleSelectPlace });
      } catch (err) {
        const { status, code, message } = parseApiError(err);
        if (status === 401) {
          localStorage.removeItem("accessToken");
          alert("토큰이 올바르지 않습니다. 다시 로그인해 주세요.");
          navigate("/login");
          return;
        }
        if (status === 403) {
          alert("해당 리소스에 접근 할 권한이 없습니다.");
          navigate(-1);
          return;
        }
        if (status === 404) {
          if (
            code === "Plan Not Found" ||
            /Plan Not Found/i.test(message ?? "")
          ) {
            alert("플랜을 찾을 수 없습니다.");
            navigate(-1);
            return;
          }
          if (
            code === "User Not Found" ||
            /User Not Found/i.test(message ?? "")
          ) {
            alert("유저를 찾을 수 없습니다. 다시 로그인해 주세요.");
            navigate("/login");
            return;
          }
          alert(message ?? "리소스를 찾을 수 없습니다.");
          return;
        }
        if (status === 500) {
          alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        alert(message ?? "장소 목록을 불러오지 못했습니다.");
      }
    }, [planId, navigate, setPlaces, addMarkers]);
  
    useEffect(() => {
      const token = getAccessToken();
      if (!token) return;
  
      getPlan(planId, token)
        .then(({ data }) => {
          setCanEdit(Boolean(data?.isOwner) || Boolean(data?.isMember));
        })
        .catch((_) => {
          setCanEdit(false);
        });
    }, [planId]);
  
    useEffect(() => {
      fetchPlanTitle();
      refreshPlanPlaces();
    }, [fetchPlanTitle, refreshPlanPlaces]);
  
    useEffect(() => {
      if (activeTab !== "search" && places.length)
        addMarkers(places, { onClick: handleSelectPlace });
    }, [places, activeTab, addMarkers]);
  
    useEffect(() => {
      if (activeTab === "search")
        addMarkers(searchResults || [], { onClick: handleSelectPlace });
    }, [activeTab, searchResults, addMarkers]);
  
    useEffect(() => {
      if (activeTab === "route") {
        setCollapsed(false);
        loadRoutes();
      }
    }, [activeTab, loadRoutes]);
  
    useEffect(() => {
      if (firstPlaceLatLng && mapInstance.current && activeTab !== "search") {
        flyTo(
          mapInstance.current,
          firstPlaceLatLng.lat,
          firstPlaceLatLng.lng,
          15
        );
      }
    }, [firstPlaceLatLng, activeTab, mapInstance]);
  
    const handleSelectPlace = useCallback(
      (p) => {
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
      },
      [mapInstance]
    );
  
    useEffect(() => {
      if (!detailOpen || !detailId) return;
      const token = getAccessToken();
      if (!token) return;
      setDL(true);
      getPlaceDetail(detailId, token)
        .then(({ data }) => setDetail(data))
        .catch((err) => {
          const { message } = parseApiError(err);
          alert(message ?? "장소 상세를 불러오지 못했습니다.");
        })
        .finally(() => setDL(false));
    }, [detailOpen, detailId]);
  
    const closeDetail = useCallback(() => {
      setDetailOpen(false);
      setDetailId(null);
      setDetail(null);
      if (activeTab !== "search" && places.length)
        addMarkers(places, { onClick: handleSelectPlace });
    }, [activeTab, places, addMarkers]);
  
    const savePlace = async () => {
      if (!detail) return;
      const token = getAccessToken();
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
        const { data } = await patchPlace(detail.id, payload, token);
        const normalized = { ...data, pinColor: data.pin_color ?? data.pinColor };
        setDetail(normalized);
        replacePlace(normalized);
        setEditingPlace(false);
        await refreshPlanPlaces();
      } catch (e) {
        const { message } = parseApiError(e);
        alert(message ?? "장소 수정 실패");
      } finally {
        setSaving(false);
      }
    };
  
    const deletePlace = async () => {
      if (!detail) return;
      const token = getAccessToken();
      if (!token) return alert("로그인이 필요합니다.");
      try {
        setDeleting(true);
        await deletePlaces([detail.id], token);
        setDetailOpen(false);
        setDetail(null);
        await refreshPlanPlaces();
      } catch (e) {
        const { message } = parseApiError(e);
        alert(message ?? "장소 삭제 실패");
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
  
    const handleSearch = async () => {
      if (!keyword.trim()) return alert("검색 할 키워드를 입력하세요.");
      const token = getAccessToken();
      if (!token) return alert("로그인이 필요합니다.");
      try {
        const { data } = await apiSearchPlaces(keyword, token);
        const list = Array.isArray(data) ? data : [];
        setSearchResults(
          list.map((f) => ({
            ...f,
            lat: parseMapCoord(f.mapy) ?? parseFloat(f.lat),
            lng: parseMapCoord(f.mapx) ?? parseFloat(f.lng),
          }))
        );
        setActiveTab("search");
        setDetailOpen(false);
        setCollapsed(false);
        if (list.length > 0) {
          const f = list[0];
          const lat = parseMapCoord(f.mapy) ?? parseFloat(f.lat);
          const lng = parseMapCoord(f.mapx) ?? parseFloat(f.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng))
            flyTo(mapInstance.current, lat, lng, 15);
        }
      } catch (err) {
        const { message } = parseApiError(err);
        alert(message ?? "네트워크/서버 오류가 발생했습니다.");
      }
    };
  
    const handleSelectSearchItem = (place) => {
      if (!mapInstance.current || !window.naver) return;
      const lat = parseMapCoord(place.mapy) ?? parseFloat(place.lat);
      const lng = parseMapCoord(place.mapx) ?? parseFloat(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      flyTo(mapInstance.current, lat, lng, 16);
      setCollapsed(true);
    };
  
    const handleSaveSearchPlace = async (
      place,
      colorHex,
      nickname,
      description
    ) => {
      const token = getAccessToken();
      if (!token) return alert("로그인이 필요합니다.");
  
      const title = place.title;
      const address = place.address;
      const roadAddress = place.roadAddress;
      const mapx = String(place.mapx ?? "");
      const mapy = String(place.mapy ?? "");
      const lat = parseMapCoord(place.mapy) ?? parseFloat(place.lat);
      const lng = parseMapCoord(place.mapx) ?? parseFloat(place.lng);
      const pinColor = colorHex;
  
      if (!title || (!address && !roadAddress) || !mapx || !mapy) {
        return alert("필수 정보가 부족해 저장할 수 없습니다.");
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return alert("좌표 정보가 올바르지 않습니다.");
      if (!/^#[0-9A-Fa-f]{6}$/.test(pinColor))
        return alert("올바른 핀 색상이 아닙니다.");
  
      const nickTrim = (nickname ?? "").trim();
      if (nickTrim && (nickTrim.length < 2 || nickTrim.length > 30))
        return alert("nickname은 2~30자여야 합니다.");
  
      const descTrim = (description ?? "").trim();
      if (descTrim && (descTrim.length < 2 || descTrim.length > 255))
        return alert("description은 2~255자여야 합니다.");
  
      const payload = {
        placeId: place.placeId ?? place.id,
        nickname: nickTrim || null,
        title,
        address,
        roadAddress: roadAddress || address,
        hours: Array.isArray(place.hours)
          ? place.hours
          : Array.isArray(place.holiday)
          ? place.holiday
          : undefined,
        mapx,
        mapy,
        lat,
        lng,
        pinColor,
        planId,
        description: descTrim || null,
      };
  
      try {
        setSavingSearchId(place.placeId ?? place.id);
        await savePlaceToPlan(payload, token);
        alert("저장되었습니다.");
        await refreshPlanPlaces();
      } catch (e) {
        const { message } = parseApiError(e);
        alert(message ?? "저장에 실패했습니다.");
      } finally {
        setSavingSearchId(null);
      }
    };
  
    const clearRouteOverlays = useCallback(() => {
      const m = routeOverlaysRef.current;
      m.markers.forEach((x) => x.setMap(null));
      m.arrows.forEach((x) => x.setMap(null));
      if (m.line) m.line.setMap(null);
      routeOverlaysRef.current = { markers: [], arrows: [], line: null };
    }, []);
  
    const drawRoute = useCallback(
      (list) => {
        if (!mapInstance.current || !window.naver) return;
        clearRouteOverlays();
        const naver = window.naver;
  
        const Z_ROUTE_BASE = 10000;
        const Z_ROUTE_LINE = Z_ROUTE_BASE - 10;
        const Z_ROUTE_ARROW = Z_ROUTE_BASE - 5;
  
        const valid = (list || [])
          .filter((p) => !p.isPinPlaceDeleted)
          .map((p) => ({
            ...p,
            lat: Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy),
            lng: Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx),
          }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  
        if (!valid.length) return;
  
        const path = [];
        const markers = [];
        const arrows = [];
        const bounds = new naver.maps.LatLngBounds();
  
        valid.forEach((p, idx) => {
          const pos = new naver.maps.LatLng(p.lat, p.lng);
          bounds.extend(pos);
          path.push(pos);
          const html = `<div style="width:24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${
            p.color || "#93D3E7"
          };color:#fff;font-weight:800;font-size:12px;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.25)">${
            idx + 1
          }</div>`;
          const marker = new naver.maps.Marker({
            position: pos,
            map: mapInstance.current,
            icon: { content: html, anchor: new naver.maps.Point(12, 12) },
            zIndex: Z_ROUTE_BASE + idx,
          });
          markers.push(marker);
        });
  
        for (let i = 0; i < path.length - 1; i++) {
          const a = path[i];
          const b = path[i + 1];
          const mid = new naver.maps.LatLng((a.y + b.y) / 2, (a.x + b.x) / 2);
          const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const arrowHtml = `<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #777;transform:rotate(${deg}deg)"></div>`;
          const arrow = new naver.maps.Marker({
            position: mid,
            map: mapInstance.current,
            icon: { content: arrowHtml, anchor: new naver.maps.Point(7, 7) },
            zIndex: Z_ROUTE_ARROW,
          });
          arrows.push(arrow);
        }
  
        const line = new naver.maps.Polyline({
          map: mapInstance.current,
          path,
          strokeWeight: 3,
          strokeColor: "#777",
          strokeOpacity: 0.9,
          zIndex: Z_ROUTE_LINE,
        });
  
        mapInstance.current.fitBounds(bounds, {
          top: 80,
          left: 20,
          right: 20,
          bottom: 220,
        });
        routeOverlaysRef.current = { markers, arrows, line };
      },
      [clearRouteOverlays, mapInstance]
    );
  
    const filteredRoutePlaces = useMemo(() => {
      if (!routeDate) return routePlaces;
      return routePlaces.filter(
        (p) => (p.date || "").replace(/-/g, ".") === routeDate
      );
    }, [routePlaces, routeDate]);
  
    useEffect(() => {
      if (selectedRoute) {
        drawRoute(filteredRoutePlaces);
      }
    }, [selectedRoute, filteredRoutePlaces, drawRoute]);
  
    const openRouteDetail = useCallback(async (route) => {
      const token = getAccessToken();
      if (!token) return alert("로그인이 필요합니다.");
      try {
        setSelectedRoute(route);
        setCollapsed(false);
        setActiveTab("route");
        setRouteLoading(true);
  
        const { data } = await getRoutePlaces(route.routeId || route.id, token);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
  
        const normalized = list
          .map((p) => ({
            routePlaceId: p.routePlaceId,
            pinPlaceId: p.pinPlaceId,
            title: p.title,
            nickname: p.nickname,
            description: p.description,
            sequence: Number(p.sequence ?? 0),
            date: p.date,
            address: p.address,
            roadAddress: p.roadAddress,
            mapx: p.mapx,
            mapy: p.mapy,
            lat: Number.isFinite(p.lat) ? Number(p.lat) : parseMapCoord(p.mapy),
            lng: Number.isFinite(p.lng) ? Number(p.lng) : parseMapCoord(p.mapx),
            color: p.color,
            isPinPlaceDeleted: Boolean(p.isPinPlaceDeleted),
          }))
          .sort((a, b) => a.sequence - b.sequence);
  
        setRoutePlaces(normalized);
  
        const firstDate = (normalized.find((x) => !!x.date)?.date || "").replace(
          /-/g,
          "."
        );
        setRouteDate(firstDate || "");
      } catch (e) {
        const { status, message } = parseApiError(e);
        if (status === 404) alert("루트를 찾을 수 없습니다.");
        else alert(message ?? "루트 장소를 불러오지 못했습니다.");
      } finally {
        setRouteLoading(false);
      }
    }, []);
  
    const closeRouteDetail = useCallback(() => {
      setSelectedRoute(null);
      setRoutePlaces([]);
      setRouteLoading(false);
      setRouteDate("");
      clearRouteOverlays();
    }, [clearRouteOverlays]);
  
    const openPlaceFromRoute = useCallback((pinPlaceId) => {
      if (!pinPlaceId) return;
      setCollapsed(false);
      setDetailOpen(true);
      setDetail(null);
      setEditingPlace(false);
      setShowDeleteConfirm(false);
      setDetailId(pinPlaceId);
      setActiveTab("places");
    }, []);
  
    const getY = (e) =>
      e?.touches?.[0]?.clientY ??
      e?.changedTouches?.[0]?.clientY ??
      e?.clientY ??
      0;
  
    const onDragMove = useCallback((e) => {
      if (!draggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const y = getY(e);
      draggedDYRef.current = y - dragStartY.current;
    }, []);
  
    const detachDragListeners = () => {
      window.removeEventListener("mousemove", onDragMove, true);
      window.removeEventListener("mouseup", onDragEnd, true);
      window.removeEventListener("touchmove", onDragMove, true);
      window.removeEventListener("touchend", onDragEnd, true);
    };
  
    const onDragEnd = useCallback((e) => {
      if (!draggingRef.current) return;
      const delta = draggedDYRef.current;
      const THRESHOLD = 80;
      if (delta > THRESHOLD) setCollapsed(true);
      else if (delta < -THRESHOLD) setCollapsed(false);
      draggingRef.current = false;
      detachDragListeners();
    }, []);
  
    const onHandleDragStart = useCallback(
      (e) => {
        if (e.type === "mousedown" && e.button !== 0) return;
        dragStartY.current = getY(e);
        draggedDYRef.current = 0;
        draggingRef.current = true;
        window.addEventListener("mousemove", onDragMove, {
          passive: false,
          capture: true,
        });
        window.addEventListener("mouseup", onDragEnd, {
          passive: false,
          capture: true,
        });
        window.addEventListener("touchmove", onDragMove, {
          passive: false,
          capture: true,
        });
        window.addEventListener("touchend", onDragEnd, {
          passive: false,
          capture: true,
        });
      },
      [onDragMove, onDragEnd]
    );
  
    const onHandleClick = useCallback(() => {
      if (Math.abs(draggedDYRef.current) > 6) return;
      setCollapsed((v) => !v);
    }, []);
  
    const expanded =
      (activeTab === "route" || openCreate || selectedRoute) && !collapsed;
  
    return (
      <div className={styles.container}>
        <PlanDetailHeader
          title={planTitle}
          isLoggedIn={false}
          onClickSettings={
            canEdit ? () => navigate(`/plan/${planId}/settings`) : undefined
          }
        />
  
        <SearchBar
          keyword={keyword}
          setKeyword={setKeyword}
          onSearch={handleSearch}
        />
  
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
          style={expanded ? { maxHeight: "82vh" } : undefined}
        >
          <div
            ref={handleRef}
            className={styles.sheetHandle}
            onMouseDown={onHandleDragStart}
            onTouchStart={onHandleDragStart}
            onClick={onHandleClick}
            role="button"
            aria-label="시트 드래그 핸들"
          />
  
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "places" ? styles.tabActive : ""
              }`}
              onClick={() => {
                setActiveTab("places");
                setDetailOpen(false);
                closeRouteDetail();
                addMarkers(places, { onClick: handleSelectPlace });
              }}
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
  
            {(searchResults.length > 0 || activeTab === "search") && (
              <button
                className={`${styles.tab} ${
                  activeTab === "search" ? styles.tabActive : ""
                }`}
                onClick={() => {
                  setActiveTab("search");
                  setDetailOpen(false);
                  closeRouteDetail();
                }}
              >
                검색 결과
              </button>
            )}
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
                pinColorOptions={pinColorOptions}
              />
            )
          ) : activeTab === "search" ? (
            <SearchResultList
              results={searchResults}
              onSelect={handleSelectSearchItem}
              colorOptions={pinColorOptions}
              onRequestSave={handleSaveSearchPlace}
              savingId={savingSearchId}
            />
          ) : selectedRoute ? (
            <RouteDetail
              route={selectedRoute}
              places={filteredRoutePlaces}
              allPlaces={routePlaces}
              loading={routeLoading}
              date={routeDate}
              onChangeDate={setRouteDate}
              onBack={closeRouteDetail}
              onOpenPlace={openPlaceFromRoute}
              planId={planId}
              onRefresh={(opts) => {
                if (opts?.reopen && selectedRoute) {
                  openRouteDetail(selectedRoute);
                } else {
                  loadRoutes();
                }
              }}
            />
          ) : (
            <>
              <RouteList
                routes={routes}
                onAdd={() => setOpenCreate(true)}
                onSelect={openRouteDetail}
              />
              <CreateRouteModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSubmit={async (name, desc) => {
                  await createRoute(name, desc);
                  setOpenCreate(false);
                  loadRoutes();
                }}
                creating={creating}
              />
            </>
          )}
        </div>
      </div>
    );
  }
  