import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PlanSettingsPage.module.css";
import headerStyles from "../../components/Header/Header.module.css";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import * as api from "../../services/api";

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

  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const [tab, setTab] = useState("info");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.getPlanDetail(planId, token);
      const normalized = {
        planId: data.planId ?? data.id ?? planId,
        name: data.name ?? data.planName ?? data.title ?? "",
        isPublic: Boolean(data.isPublic ?? data.public),
        createdAt: data.createdAt ?? "",
        ownerId: data.ownerId ?? "",
        ownerNickname: data.ownerNickname ?? data.owner ?? "",
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        member: Array.isArray(data.member) ? data.member : [],
        isOwner: Boolean(data.isOwner),
        isMember: Boolean(data.isMember),
      };
      setPlan(normalized);
      setIsOwner(normalized.isOwner);
      setIsMember(normalized.isMember);
      setSelected(new Set());
    } catch (err) {
      const { status, code, message } = api.parseApiError(err);
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
      alert(message ?? "플랜 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [planId, token, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const memberCount = plan?.member?.length ?? 0;

  const allChecked = useMemo(() => {
    if (!plan) return false;
    const manageable = plan.member.filter((m) => m.memberId !== plan.ownerId);
    return manageable.length > 0 && manageable.every((m) => selected.has(m.memberId));
  }, [plan, selected]);

  const toggleAll = () => {
    if (!plan) return;
    const manageable = plan.member.filter((m) => m.memberId !== plan.ownerId);
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(manageable.map((m) => m.memberId)));
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInvite = async () => {
    if (!plan || inviting) return;
    try {
      setInviting(true);
      const { data } = await api.createInviteCode(plan.planId, token);
      const code = data?.code || "";
      if (!code) {
        alert("초대 코드를 생성하지 못했습니다.");
        return;
      }
      setInviteCode(code);
      setCopiedCode(false);
      setInviteOpen(true);
    } catch (err) {
      const { status, code, message } = api.parseApiError(err);
      if (status === 403) return alert("초대코드 생성 권한이 없습니다.");
      alert(message ?? "초대 코드 생성에 실패했습니다.");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
    } catch {}
  };

  const doKick = async () => {
    if (!plan || selected.size === 0) return;
    try {
      setProcessingAction(true);
      await api.deletePlanUsers(plan.planId, Array.from(selected), token);
      setConfirmKickOpen(false);
      setSelected(new Set());
      await load();
    } catch (err) {
      const { message } = api.parseApiError(err);
      alert(message ?? "멤버 퇴출에 실패했습니다.");
    } finally {
      setProcessingAction(false);
    }
  };

  const doLeave = async () => {
    if (!plan) return;
    try {
      setLeaving(true);
      await api.leavePlans([plan.planId], token);
      setConfirmLeaveOpen(false);
      alert("플랜에서 탈퇴했어요.");
      navigate("/");
    } catch (err) {
      const { message } = api.parseApiError(err);
      alert(message ?? "탈퇴에 실패했습니다.");
    } finally {
      setLeaving(false);
    }
  };

  const doDeletePlan = async () => {
    if (!plan) return;
    try {
      setDeletingPlan(true);
      await api.deletePlanPermanent(plan.planId, token);
      alert("플랜이 영구 삭제되었습니다.");
      setDeleteModalOpen(false);
      navigate("/");
    } catch (err) {
      const { message } = api.parseApiError(err);
      alert(message ?? "플랜 삭제에 실패했습니다.");
    } finally {
      setDeletingPlan(false);
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!plan) return null;

  const kickCount = selected.size;

  const goEditName = () => navigate(`/plan/${planId}/edit#name`);
  const goEditPublic = () => navigate(`/plan/${planId}/edit#visibility`);
  const goEditDates = () => navigate(`/plan/${planId}/edit#dates`);

  return (
    <div className={styles.container}>
      <Header title="여행 플랜 설정" onBack={() => navigate(-1)} />

      <div className={styles.titleBar}>
        <div className={styles.planName}>{plan.name}</div>
        {(isOwner || isMember) && (
          <div className={styles.tabPills}>
            <button
              className={`${styles.pill} ${tab === "info" ? styles.pillActive : ""}`}
              onClick={() => setTab("info")}
            >
              정보
            </button>
            <button
              className={`${styles.pill} ${tab === "members" ? styles.pillActive : ""}`}
              onClick={() => setTab("members")}
            >
              멤버 <span className={styles.pillBadge}>{memberCount}</span>
            </button>
          </div>
        )}
      </div>

      {tab === "info" && (
        <div className={styles.section}>
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

          <div className={styles.sectionTitle}>플랜 설정</div>

          {isOwner ? (
            <div className={styles.actionList}>
              <button className={styles.actionItem} onClick={goEditName}>
                <span>플랜 수정</span>
                <span className={styles.chevron} aria-hidden>›</span>
              </button>
              <button
                className={`${styles.actionItem} ${styles.actionDanger}`}
                onClick={() => setDeleteModalOpen(true)}
              >
                <span>플랜 삭제</span>
                <span className={styles.chevron} aria-hidden>›</span>
              </button>
            </div>
          ) : (
            <div className={styles.actionList}>
              <button
                className={`${styles.actionItem} ${styles.actionDanger}`}
                onClick={() => setConfirmLeaveOpen(true)}
                disabled={leaving}
              >
                <span>플랜 탈퇴</span>
                <span className={styles.chevron} aria-hidden>›</span>
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className={styles.section}>
          <div className={styles.memberHeader}>
            <label className={styles.checkAll}>
              {isOwner && (
                <>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                  <span>전체 선택</span>
                </>
              )}
            </label>

            {isOwner && (
              <button
                className={styles.inviteBtn}
                onClick={handleInvite}
                disabled={inviting}
              >
                {copiedCode ? "복사됨" : "초대 코드 생성"}
              </button>
            )}
          </div>

          <div className={styles.memberList}>
            {plan.member.map((m) => {
              const disabled = m.memberId === plan.ownerId;
              const checked = selected.has(m.memberId);
              return (
                <div key={m.memberId} className={styles.memberItem}>
                  <div className={styles.memberLeft}>
                    {isOwner ? (
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        onChange={() => toggleOne(m.memberId)}
                      />
                    ) : null}
                    <span className={styles.memberName}>{m.nickname}</span>
                    {m.memberId === plan.ownerId && (
                      <span className={styles.ownerChip}>OWNER</span>
                    )}
                  </div>
                </div>
              );
            })}
            {plan.member.length === 0 && (
              <div className={styles.memberEmpty}>멤버가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {tab === "members" && isOwner && selected.size > 0 && (
        <div className={styles.bulkActions}>
          <button
            className={styles.kickBig}
            onClick={() => setConfirmKickOpen(true)}
            disabled={processingAction}
          >
            퇴출
          </button>
          <button
            className={styles.blockBig}
            onClick={() => setConfirmBlockOpen(true)}
            disabled={processingAction}
          >
            차단
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onConfirm={copyInviteCode}
        title="초대 코드"
        description={inviteCode || ""}
        confirmText={copiedCode ? "복사됨" : "코드 복사"}
        cancelText="닫기"
        confirmButtonColor="var(--secondary-color)"
        confirmTextColor="var(--quinary-color)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={confirmKickOpen}
        onClose={() => setConfirmKickOpen(false)}
        onConfirm={doKick}
        title={`정말 ${kickCount}명의 멤버를 퇴출하시겠습니까?`}
        description="퇴출된 멤버는 비공개 플랜에 접근할 수 없으며, 공개 플랜에는 접근이 가능합니다. 추후 초대시 다시 참여가 참여가 가능합니다."
        confirmText={processingAction ? "처리 중..." : "퇴출하기"}
        cancelText="닫기"
        confirmButtonColor="var(--tertiary-color)"
        confirmTextColor="var(--text-secondary)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={() => setConfirmBlockOpen(false)}
        title="차단 기능은 추후 개발 예정입니다."
        description="현재는 ‘퇴출’만 가능합니다. 차단 기능은 곧 제공될 예정이에요."
        confirmText="확인"
        cancelText="닫기"
        confirmButtonColor="var(--secondary-color)"
        confirmTextColor="var(--quinary-color)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        onConfirm={doLeave}
        title="플랜 탈퇴"
        description="정말 이 플랜에서 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다."
        confirmText={leaving ? "탈퇴 중..." : "탈퇴"}
        cancelText="취소"
        confirmButtonColor="var(--quaternary-color)"
        confirmTextColor="var(--tertiary-color)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={doDeletePlan}
        title="플랜 영구 삭제"
        description="정말 이 플랜을 영구 삭제하시겠습니까? 플랜 삭제 후 플랜에 속한 멤버들도 플랜을 조회하지 못합니다."
        confirmText={deletingPlan ? "삭제 중..." : "삭제"}
        cancelText="취소"
        confirmButtonColor="var(--tertiary-color)"
        confirmTextColor="var(--text-secondary)"
        cancelButtonColor="#000"
        cancelTextColor="var(--text-secondary)"
      />
    </div>
  );
}
