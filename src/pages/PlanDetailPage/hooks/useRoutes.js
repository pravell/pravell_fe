import { useCallback, useState } from "react";
import { createRoute, getRoutesByPlan, parseApiError } from "../../../services/api";

export default function useRoutes(planId, navigate) {
  const [routes, setRoutes] = useState([]);
  const [creating, setCreating] = useState(false);
  const token = localStorage.getItem("accessToken");

  const loadRoutes = useCallback(async () => {
    if (!token) { alert("로그인이 필요합니다."); navigate("/login"); return; }
    try {
      const { data } = await getRoutesByPlan(planId, token);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRoutes(list);
    } catch (err) {
      const { status, code, message } = parseApiError(err);
      if (status === 401) { localStorage.removeItem("accessToken"); alert("토큰이 올바르지 않습니다."); navigate("/login"); return; }
      if (status === 403) { alert("접근 권한이 없습니다."); return; }
      if (status === 404) { alert(/Plan Not Found|플랜을 찾을 수 없습니다/i.test(message||code) ? "플랜을 찾을 수 없습니다." : "유저를 찾을 수 없습니다."); return; }
      if (status === 500) { alert("서버 오류입니다."); return; }
      alert(message ?? "루트를 불러오지 못했습니다.");
    }
  }, [planId, token, navigate]);

  const create = useCallback(async (name, description) => {
    if (!token) { alert("로그인이 필요합니다."); navigate("/login"); return; }
    if (!name?.trim()) { alert("이름은 필수입니다."); return; }
    if (name.trim().length < 2 || name.trim().length > 30) { alert("이름은 2~30자"); return; }
    if (description && (description.trim().length < 2 || description.trim().length > 50)) { alert("설명은 2~50자"); return; }
    try {
      setCreating(true);
      await createRoute({ planId, name: name.trim(), description: description?.trim() || null }, token);
      await loadRoutes();
    } catch (err) {
      const { status, message, code } = parseApiError(err);
      if (status === 401) { localStorage.removeItem("accessToken"); alert("토큰이 올바르지 않습니다."); navigate("/login"); return; }
      if (status === 403) { alert("루트 생성 권한이 없습니다."); return; }
      if (status === 404) { alert(/Plan Not Found|플랜을 찾을 수 없습니다/i.test(message||code) ? "플랜을 찾을 수 없습니다." : "유저를 찾을 수 없습니다."); return; }
      if (status === 400) { alert(message ?? "요청이 올바르지 않습니다."); return; }
      if (status === 500) { alert("서버 오류입니다."); return; }
      alert(message ?? "루트 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }, [planId, token, navigate, loadRoutes]);

  return { routes, loadRoutes, create, creating };
}
