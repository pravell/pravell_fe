import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const stripBearer = (t = "") => t.replace(/^Bearer\s+/i, "");

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || "";
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY) || "";
export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_KEY, stripBearer(accessToken));
  if (refreshToken)
    localStorage.setItem(REFRESH_KEY, stripBearer(refreshToken));
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

API.interceptors.request.use((config) => {
  const at = getAccessToken();
  if (at) config.headers.Authorization = `Bearer ${stripBearer(at)}`;
  return config;
});

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  queue = [];
};

API.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(API(original));
            },
            reject,
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const curAccess = getAccessToken();
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/v1/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${stripBearer(curAccess)}` },
          }
        );
        const newAccess = stripBearer(data?.access_token || "");
        const newRefresh = stripBearer(data?.refresh_token || "");
        setTokens({ accessToken: newAccess, refreshToken: newRefresh });
        API.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        original.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return API(original);
      } catch (e) {
        processQueue(e, null);
        clearTokens();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const authHeader = (token) =>
  token ? { headers: { Authorization: `Bearer ${stripBearer(token)}` } } : {};

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

export const getRoutesByPlan = (planId, token) =>
  API.get(`/v1/routes/${planId}`, authHeader(token));

export const createRoute = (payload, token) =>
  API.post(`/v1/routes`, payload, authHeader(token));

export const parseApiError = (err) => {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  const message = err?.response?.data?.message;
  return { status, code, message };
};

export default API;
