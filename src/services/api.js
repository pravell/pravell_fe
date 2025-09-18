import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, 
  timeout: 15000,        
});

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const stripBearer = (t = "") => t.replace(/^Bearer\s+/i, "");

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || "";
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY) || "";
export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_KEY, stripBearer(accessToken));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, stripBearer(refreshToken));
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

const processQueue = (error, newAccessToken = null) => {
  queue.forEach(({ resolve, reject, original }) => {
    if (error) {
      reject(error);
    } else {
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      resolve(API(original));
    }
  });
  queue = [];
};

const refreshTokens = async () => {
  const rt = getRefreshToken(); 
  const url = `${process.env.REACT_APP_API_URL}/v1/auth/refresh`;

  const { data } = await axios.post(
    url,
    rt ? { refreshToken: rt } : {},
    {
      withCredentials: true, 
      headers: rt ? { Authorization: `Bearer ${stripBearer(rt)}` } : {},
      timeout: 15000,
    }
  );

  const newAccess =
    stripBearer(data?.accessToken || data?.access_token || "");
  const newRefresh =
    stripBearer(data?.refreshToken || data?.refresh_token || "");

  if (!newAccess) {
    throw new Error("REFRESH_RESPONSE_MISSING_ACCESS");
  }

  setTokens({ accessToken: newAccess, refreshToken: newRefresh });
  API.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
  return newAccess;
};

const SHOULD_REFRESH = new Set([401, 419]);

API.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    if (SHOULD_REFRESH.has(status) && !original._retry) {
      const isRefreshCall = String(original?.url || "").includes("/v1/auth/refresh");
      if (isRefreshCall) {
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, original });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const newAccess = await refreshTokens();
        processQueue(null, newAccess);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return API(original);
      } catch (e) {
        processQueue(e, null);
        const st = e?.response?.status;
        if (st === 401 || st === 403) {
          clearTokens();
        }
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

export const signOut = async () => {
  try {
    await API.post("/v1/auth/sign-out");
  } catch (_) {
  } finally {
    clearTokens();
  }
};

export const getPlan = (planId, token) =>
  API.get(`/v1/plans/${planId}`, authHeader(token));

export const getPlanDetail = (planId, token) =>
  API.get(`/v1/plans/${planId}`, authHeader(token));

export const getPlanPlaces = (planId, token) =>
  API.get(`/v1/places/plan/${planId}`, authHeader(token));

export const getPlaceDetail = (placeId, token) =>
  API.get(`/v1/places/${placeId}`, authHeader(token));

export const searchPlaces = (keyword, token) =>
  API.get(`/v1/places/search?keyword=${encodeURIComponent(keyword)}`, authHeader(token));

export const savePlaceToPlan = (payload, token) =>
  API.post(`/v1/places`, payload, authHeader(token));

export const patchPlace = (placeId, payload, token) =>
  API.patch(`/v1/places/${placeId}`, payload, authHeader(token));

export const deletePlaces = (ids, token) =>
  API.delete(`/v1/places`, { ...authHeader(token), data: { placeId: ids } });

export const leavePlans = (planIds, token) =>
  API.delete(`/v1/plans`, { ...authHeader(token), data: { plan_ids: planIds } });

export const createInviteCode = (planId, token) =>
  API.post(`/v1/plans/${planId}/invite-code`, {}, authHeader(token));

export const getRoutesByPlan = (planId, token) =>
  API.get(`/v1/routes/${planId}`, authHeader(token));

export const createRoute = (payload, token) =>
  API.post(`/v1/routes`, payload, authHeader(token));

export const getRoutePlaces = (routeId, token) =>
  API.get(`/v1/routes/${routeId}/places`, authHeader(token));

export const saveRoutePlace = (routeId, payload, token) =>
  API.post(`/v1/routes/${routeId}/places`, payload, authHeader(token));

export const patchRoute = (routeId, payload, token) =>
  API.patch(`/v1/routes/${routeId}`, payload, authHeader(token));

export const patchRoutePlace = (routeId, routePlaceId, payload, token) =>
  API.patch(`/v1/routes/${routeId}/places/${routePlaceId}`, payload, authHeader(token));

export const deleteRoutes = (planId, routeIds, token) =>
  API.delete(`/v1/routes`, {
    ...authHeader(token),
    params: { planId },
    data: { routeId: routeIds },
  });

export const deleteRoutePlaces = (routeId, deleteIds, token) =>
  API.delete(`/v1/routes/${routeId}/places`, {
    ...authHeader(token),
    data: { deleteRoutePlaceId: deleteIds },
  });

export const parseApiError = (err) => {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  const message =
    err?.response?.data?.message ||
    err?.message ||
    "네트워크 또는 서버 오류가 발생했습니다.";
  return { status, code, message };
};

export default API;
