import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PlanSettingsPage.module.css";
import headerStyles from "../../components/Header/Header.module.css";
import {
  getPlanDetail,
  leavePlans,
  parseApiError,
  createInviteCode,
} from "../../services/api";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

function Header({ title, onBack }) {
  return (
    <div className={headerStyles.headerContainer}>
      <div className={headerStyles.leftComponent}>
        <button className={styles.backBtn} onClick={onBack} aria-label="back">
          ‹
        </button>
      </div>
      <h1 className={headerStyles.pageTitle}>{title}</h1>
      <div className={headerStyles.rightComponent} />
    </div>
  );
}

export default function PlanSettingsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviting, setInviting] = useState(false);
  const token = localStorage.getItem("accessToken");

  const load = useCallback(async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const { data } = await getPlanDetail(planId, token);
      setPlan({
        planId: data.planId ?? data.id ?? planId,
        name: data.name ?? data.planName ?? data.title ?? "",
        isPublic: String(data.isPublic ?? data.public ?? "") === "true",
        createdAt: data.createdAt ?? "",
        ownerId: data.ownerId ?? "",
        ownerNickname: data.ownerNickname ?? data.owner ?? "",
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        member: Array.isArray(data.member) ? data.member : [],
      });
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
        if (/User Not Found/i.test(code || message)) {
          alert("유저를 찾을 수 없습니다. 다시 로그인해 주세요.");
          navigate("/login");
          return;
        }
        alert("플랜을 찾을 수 없습니다.");
        navigate(-1);
        return;
      }
      if (status === 500) {
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      alert(message ?? "플랜 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [planId, token, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmLeave = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

  const doLeave = async () => {
    if (!plan) return;
    try {
      setLeaving(true);
      await leavePlans([plan.planId], token);
      setConfirmOpen(false);
      alert("플랜에서 탈퇴했어요.");
      navigate("/");
    } catch (err) {
      const { status, code, message } = parseApiError(err);
      if (status === 401) {
        localStorage.removeItem("accessToken");
        alert("토큰이 올바르지 않습니다. 다시 로그인해 주세요.");
        navigate("/login");
        return;
      }
      if (status === 404 && /유저를 찾을 수 없습니다/i.test(message || code)) {
        alert("유저를 찾을 수 없습니다. 다시 로그인해 주세요.");
        navigate("/login");
        return;
      }
      if (status === 404 && /플랜을 찾을 수 없습니다/i.test(message || code)) {
        alert("플랜을 찾을 수 없습니다.");
        navigate(-1);
        return;
      }
      if (status === 404 && /해당 플랜에 유저가 존재/i.test(message || code)) {
        alert("해당 플랜에 유저가 존재하지 않습니다.");
        return;
      }
      if (status === 400) {
        alert("플랜을 소유한 유저는 탈퇴할 수 없습니다.");
        return;
      }
      if (status === 500) {
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      alert(message ?? "탈퇴에 실패했습니다.");
    } finally {
      setLeaving(false);
    }
  };

  const handleInvite = async () => {
    if (!plan || inviting) return;
    try {
      setInviting(true);
      const { data } = await createInviteCode(plan.planId, token);
      const code = data?.code || "";
      if (!code) {
        alert("초대 코드를 생성하지 못했습니다.");
        return;
      }
      setInviteCode(code);
      setInviteOpen(true);
    } catch (err) {
      const { status, code, message } = parseApiError(err);
      if (status === 401) {
        localStorage.removeItem("accessToken");
        alert("토큰이 올바르지 않습니다. 다시 로그인해 주세요.");
        navigate("/login");
        return;
      }
      if (status === 404 && /플랜을 찾을 수 없습니다/i.test(message || code)) {
        alert("플랜을 찾을 수 없습니다.");
        navigate(-1);
        return;
      }
      if (status === 404 && /유저를 찾을 수 없습니다/i.test(message || code)) {
        alert("유저를 찾을 수 없습니다. 다시 로그인해 주세요.");
        navigate("/login");
        return;
      }
      if (status === 403) {
        alert("해당 플랜의 초대코드를 생성 할 권한이 없습니다.");
        return;
      }
      if (status === 500) {
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      alert(message ?? "초대 코드 생성에 실패했습니다.");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteOpen(false);
    } catch {
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!plan) return null;

  return (
    <div className={styles.container}>
      <Header title="여행 플랜 설정" onBack={() => navigate(-1)} />
      <div className={styles.section}>
        <div className={styles.planName}>{plan.name}</div>
        <div className={styles.row}>
          <div className={styles.rowLabel}>공개 여부</div>
          <div className={styles.rowValue}>
            {plan.isPublic ? "공개 플랜" : "비공개 플랜"}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.rowLabel}>소유자</div>
          <div className={styles.rowValue}>{plan.ownerNickname || "-"}</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.memberHeader}>
          <div className={styles.sectionTitle}>멤버</div>
          <button
            className={styles.inviteBtn}
            onClick={handleInvite}
            disabled={inviting}
          >
            + 초대 코드 생성
          </button>
        </div>
        <div className={styles.memberList}>
          {plan.member.map((m) => (
            <div key={m.memberId} className={styles.memberItem}>
              {m.nickname}
            </div>
          ))}
          {plan.member.length === 0 && (
            <div className={styles.memberEmpty}>멤버가 없습니다.</div>
          )}
        </div>
        <div className={styles.divider} />
        <div className={styles.sectionTitle}>플랜 설정</div>
        <button
          className={styles.leaveBtn}
          disabled={leaving}
          onClick={confirmLeave}
        >
          플랜 탈퇴
        </button>
      </div>

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={closeConfirm}
        onConfirm={doLeave}
        title="플랜 탈퇴"
        description="정말 이 플랜에서 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmText="탈퇴"
        cancelText="취소"
        confirmButtonColor="var(--quaternary-color)"
        confirmTextColor="var(--tertiary-color)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onConfirm={copyInviteCode}
        title="초대 코드"
        description={inviteCode || ""}
        confirmText="코드 복사"
        cancelText="닫기"
        confirmButtonColor="var(--secondary-color)"
        confirmTextColor="var(--quinary-color)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />
    </div>
  );
}
