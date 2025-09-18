// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // HttpOnly refresh 쿠키 대응
  timeout: 15000,        // 기본 요청 타임아웃
});

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const stripBearer = (t = "") => t.replace(/^Bearer\s+/i, "");

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || "";
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY) || "";
export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_KEY, stripBearer(accessToken));
  // 서버가 refreshToken을 쿠키로만 주는 경우도 있으므로, 없으면 저장 안 함(기존 값 유지)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, stripBearer(refreshToken));
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ----- 요청 인터셉터: 매 요청에 accessToken 부착 -----
API.interceptors.request.use((config) => {
  const at = getAccessToken();
  if (at) config.headers.Authorization = `Bearer ${stripBearer(at)}`;
  return config;
});

// ----- 401 병렬 제어용 큐 -----
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

// ----- refresh 토큰으로 재발급 -----
const refreshTokens = async () => {
  const rt = getRefreshToken(); // 없을 수도 있음(쿠키만 쓰는 서버)
  const url = `${process.env.REACT_APP_API_URL}/v1/auth/refresh`;

  const { data } = await axios.post(
    url,
    rt ? { refreshToken: rt } : {},
    {
      withCredentials: true, // 쿠키 기반 리프레시 대응
      headers: rt ? { Authorization: `Bearer ${stripBearer(rt)}` } : {},
      timeout: 15000,
    }
  );

  // 응답 키 케이스 대응: (access_token / accessToken), (refresh_token / refreshToken)
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

// 만료로 간주할 상태코드(백엔드 정책에 맞게 조절)
const SHOULD_REFRESH = new Set([401, 419]);

// ----- 응답 인터셉터: 401에서 자동 리프레시 & 재시도 -----
API.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    if (SHOULD_REFRESH.has(status) && !original._retry) {
      const isRefreshCall = String(original?.url || "").includes("/v1/auth/refresh");
      if (isRefreshCall) {
        // 리프레시 자체가 만료 → 토큰만 정리하고 종료
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 다른 요청이 리프레시 중이면 큐에 넣음
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
        // ❗ 네트워크/5xx에선 토큰을 지우지 않음. 401/403 같은 인증실패 계열만 지움.
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

// ----- 인증 헤더 헬퍼 -----
const authHeader = (token) =>
  token ? { headers: { Authorization: `Bearer ${stripBearer(token)}` } } : {};

// ----- (선택) 어디서든 쓸 수 있는 로그아웃 유틸 -----
export const signOut = async () => {
  try {
    await API.post("/v1/auth/sign-out");
  } catch (_) {
    // 서버 실패여도 클라이언트 토큰은 정리
  } finally {
    clearTokens();
  }
};

// ----- API 함수들 -----
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

// ⚠️ 경로 수정: routes가 맞는 듯
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
