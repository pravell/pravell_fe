export const parseMapCoord = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/\D/g, "");
  if (!s || s.length < 8) return null;
  const intPart = s.slice(0, s.length - 7);
  const decPart = s.slice(s.length - 7);
  const num = parseFloat(`${intPart}.${decPart}`);
  return Number.isFinite(num) ? num : null;
};

export const flyTo = (map, lat, lng, zoom = 16) => {
  const latlng = new window.naver.maps.LatLng(lat, lng);
  if (typeof map.morph === "function")
    map.morph(latlng, zoom, { duration: 400 });
  else {
    map.setZoom(zoom);
    map.panTo(latlng);
  }
};
