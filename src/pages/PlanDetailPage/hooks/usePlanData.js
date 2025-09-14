import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { parseMapCoord } from '../utils/utils';

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  const firstArray = Object.values(data || {}).find(Array.isArray);
  return firstArray || [];
};

export const DEFAULT_LEGEND = [{ color: '#C0D86E', description: '저장된 장소' }];

export default function usePlanData(planId) {
  const [places, setPlaces]   = useState([]);
  const [legend, setLegend]   = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedPlanRef        = useRef(null);     
  const inflightRef           = useRef(false);    

  useEffect(() => {
    if (!planId) return;
    if (inflightRef.current) return;             
    if (fetchedPlanRef.current === planId && places.length) return; 

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    inflightRef.current = true;
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };
    const fetchPlaces = axios.get(`${process.env.REACT_APP_API_URL}/v1/places/plan/${planId}`, { headers });
    const fetchLegend = axios.get(`${process.env.REACT_APP_API_URL}/v1/markers/${planId}`, { headers });

    Promise.all([fetchPlaces, fetchLegend])
      .then(([pRes, lRes]) => {
        const pList = normalizeArray(pRes.data);
        const lList = normalizeArray(lRes.data);
        setPlaces(pList);
        setLegend(Array.isArray(lList) ? lList : []);
        fetchedPlanRef.current = planId;
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        inflightRef.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const legendToShow = useMemo(
    () => (legend && legend.length ? [...DEFAULT_LEGEND, ...legend] : DEFAULT_LEGEND),
    [legend]
  );

  const replacePlace = (updated) => {
    setPlaces(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  };
  const removePlace = (id) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  const firstPlaceLatLng = useMemo(() => {
    if (!places.length) return null;
    const f = places[0];
    const lat = Number.isFinite(f.lat) ? f.lat : parseMapCoord(f.mapy);
    const lng = Number.isFinite(f.lng) ? f.lng : parseMapCoord(f.mapx);
    return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null;
  }, [places]);

  return {
    places, setPlaces,
    legend, setLegend, legendToShow,
    loading,
    firstPlaceLatLng,
    replacePlace,
    removePlace,
  };
}
