import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getPlan = (planId, token) =>
  API.get(`/v1/plans/${planId}`, authHeader(token));

export const getPlanDetail = (planId, token) =>
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

export const leavePlans = (planIds, token) =>
  API.delete(`/v1/plans`, {
    ...authHeader(token),
    data: { plan_ids: planIds },
  });

export const createInviteCode = (planId, token) =>
  API.post(`/v1/plans/${planId}/invite-code`, {}, authHeader(token));

export const parseApiError = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const code = data?.code ?? data?.errorCode ?? data?.error;
  const message = data?.message ?? data?.error ?? err?.message;
  return { status, code, message };
};
