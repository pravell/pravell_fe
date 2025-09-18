import { useCallback, useEffect, useMemo, useState } from "react";
import { getRoutePlaces, parseApiError } from "../../../services/api";
import { parseMapCoord } from "../utils/utils";

export default function useRoutePlaces(routeId) {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const reload = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || !routeId) return;
    try {
      setLoading(true);
      const { data } = await getRoutePlaces(routeId, token);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const norm = list.map((p) => ({
        ...p,
        lat: Number.isFinite(p.lat) ? p.lat : parseMapCoord(p.mapy),
        lng: Number.isFinite(p.lng) ? p.lng : parseMapCoord(p.mapx),
        color: p.color || "#93D3E7",
        date: p.date || "",
        sequence: Number(p.sequence ?? 0),
      }));
      setRaw(norm);
      const firstDate = norm.find((x) => x.date)?.date || "";
      setSelectedDate((d) => d || firstDate);
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "루트 장소를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const dates = useMemo(() => {
    const s = new Set(raw.map((r) => r.date).filter(Boolean));
    return Array.from(s).sort();
  }, [raw]);

  const placesForDate = useMemo(() => {
    const list = raw.filter((r) => (selectedDate ? r.date === selectedDate : true));
    return list.sort((a, b) => a.sequence - b.sequence);
  }, [raw, selectedDate]);

  return { loading, raw, dates, selectedDate, setSelectedDate, placesForDate, reload };
}
