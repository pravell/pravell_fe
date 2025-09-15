import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getPlan = (planId, token) =>
  API.get(`/v1/plans/${planId}`, authHeader(token));

export const getPlanPlaces = (planId, token) =>
  API.get(`/v1/places/plan/${planId}`, authHeader(token));

export const getPlaceDetail = (placeId, token) =>
  API.get(`/v1/places/${placeId}`, authHeader(token));

export const searchPlaces = (keyword, token) =>
  API.get(
    `/v1/places/search?keyword=${encodeURIComponent(keyword)}`,
    authHeader(token)
  );

export const savePlaceToPlan = (payload, token) =>
  API.post(`/v1/places`, payload, authHeader(token));

export const patchPlace = (placeId, payload, token) =>
  API.patch(`/v1/places/${placeId}`, payload, authHeader(token));

export const deletePlaces = (ids, token) =>
  API.delete(`/v1/places`, { ...authHeader(token), data: { placeId: ids } });

export const parseApiError = (err) => {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  const message = err?.response?.data?.message;
  return { status, code, message };
};
