import { useCallback, useState } from "react";
import { getPlan, parseApiError } from "../../../services/api";

export default function usePlanTitle({ planId, initialTitle, navigate }) {
  const [planTitle, setPlanTitle] = useState(initialTitle || "플랜 상세");

  const fetchPlanTitle = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const { data } = await getPlan(planId, token);
      const name = data?.planName || data?.title || null;
      if (name) setPlanTitle(name);
    } catch (err) {
      const { status, code, message } = parseApiError(err);
      if (status === 401) {
        localStorage.removeItem("accessToken");
        alert("토큰이 올바르지 않습니다. 다시 로그인해 주세요.");
        navigate("/login");
        return;
      }
      if (status === 403) {
        alert("해당 리소스에 접근 할 권한이 없습니다.");
        navigate(-1);
        return;
      }
      if (status === 404) {
        if (code === "Plan Not Found" || /Plan Not Found/i.test(message ?? "")) {
          alert("플랜을 찾을 수 없습니다.");
        } else if (code === "User Not Found" || /User Not Found/i.test(message ?? "")) {
          alert("유저를 찾을 수 없습니다. 다시 로그인해 주세요.");
          navigate("/login");
          return;
        } else {
          alert(message ?? "리소스를 찾을 수 없습니다.");
        }
        navigate(-1);
        return;
      }
      if (status === 500) {
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      alert(message ?? "플랜 정보를 불러오지 못했습니다.");
    }
  }, [planId, navigate]);

  return { planTitle, setPlanTitle, fetchPlanTitle };
}
