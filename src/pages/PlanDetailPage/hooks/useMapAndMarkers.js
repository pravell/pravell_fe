import { useCallback, useEffect, useRef } from "react";
import { flyTo } from "../utils/utils";

const LABEL_ZOOM = 15;

const sanitize = (s = "") =>
  String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function useMapAndMarkers() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const myMarkerRef = useRef(null);
  const centeredOnce = useRef(false);

  // 현재 줌 기준으로 라벨 보일지 여부
  const shouldShowLabel = useCallback(() => {
    if (!mapInstance.current || !window.naver) return false;
    return mapInstance.current.getZoom() >= LABEL_ZOOM;
  }, []);

  // 마커 아이콘 HTML 생성
  const markerContent = useCallback((place, showLabel) => {
    const color = place.pinColor || place.pin_color || "#93D3E7";
    const label =
      sanitize(place.nickname || place.title || place.description || "");
    return `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="background:${color};width:18px;height:18px;border-radius:50%;
                    border:2px solid #EEF2BA;box-shadow:0 0 4px rgba(0,0,0,.2);"></div>
        <div style="margin-top:4px;font-size:11px;color:#444;white-space:nowrap;${
          showLabel ? "" : "display:none;"
        }">${label}</div>
      </div>`;
  }, []);

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

      // 줌 변경 시 라벨 show/hide 업데이트
      window.naver.maps.Event.addListener(
        mapInstance.current,
        "zoom_changed",
        () => {
          const show = shouldShowLabel();
          markersRef.current.forEach((m) => {
            const p = m.__place;
            if (!p) return;
            const icon = m.getIcon?.() || {};
            m.setIcon({
              ...icon,
              content: markerContent(p, show),
            });
          });
          // 내 위치 마커는 항상 위에
          if (myMarkerRef.current) {
            myMarkerRef.current.setMap(mapInstance.current);
            myMarkerRef.current.setZIndex(9999);
          }
        }
      );
    };

    load().then(init).catch(() => {});
  }, [markerContent, shouldShowLabel]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (myMarkerRef.current && mapInstance.current) {
      myMarkerRef.current.setMap(mapInstance.current);
      myMarkerRef.current.setZIndex(9999);
    }
  }, []);

  // list: 장소 배열
  // opts.onClick: (place) => void
  const addMarkers = useCallback(
    (list, opts = {}) => {
      if (!window.naver || !mapInstance.current) return;
      const onClick = opts.onClick;
      clearMarkers();
      const show = shouldShowLabel();

      list.forEach((p) => {
        const lat = Number.isFinite(p.lat) ? p.lat : null;
        const lng = Number.isFinite(p.lng) ? p.lng : null;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map: mapInstance.current,
          icon: {
            content: markerContent(p, show),
            anchor: new window.naver.maps.Point(9, 9),
          },
          zIndex: 100,
        });

        // 원본 place를 마커에 기억시켜 클릭 시 넘겨줌
        marker.__place = p;

        if (typeof onClick === "function") {
          window.naver.maps.Event.addListener(marker, "click", () => {
            onClick(p);
          });
        }

        markersRef.current.push(marker);
      });

      if (myMarkerRef.current && mapInstance.current) {
        myMarkerRef.current.setMap(mapInstance.current);
        myMarkerRef.current.setZIndex(9999);
      }
    },
    [clearMarkers, markerContent, shouldShowLabel]
  );

  const locateMe = useCallback(({ initial = false } = {}) => {
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
  }, []);

  return {
    mapRef,
    mapInstance,
    addMarkers,
    clearMarkers,
    locateMe,
  };
}
