import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PlanEditPage.module.css";
import Header from "../../components/Header/Header";
import CustomButton from "../../components/CustomButton/CustomButton";
import * as api from "../../services/api";

export default function PlanEditPage() {
  const { planId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.getPlanDetail(planId, token);
      setName(data.name ?? "");
      setIsPublic(Boolean(data.isPublic ?? data.public));
      setStartDate(data.startDate ?? "");
      setEndDate(data.endDate ?? "");
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

  const validate = () => {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      alert("플랜 이름을 입력하세요.");
      return false;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      // 생성 페이지 디자인과 동일하게 20자로 제한
      alert("플랜 이름은 2~20자여야 합니다.");
      return false;
    }
    if (startDate && endDate && startDate > endDate) {
      alert("여행 시작일이 종료일보다 늦을 수 없습니다.");
      return false;
    }
    return true;
  };

  const onSave = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        isPublic,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      await api.updatePlan(planId, payload, token); // services/api에 patch/put 구현 필요
      alert("저장되었습니다.");
      navigate(`/plan/${planId}/settings`, { replace: true });
    } catch (err) {
      const { message } = api.parseApiError(err);
      alert(message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;

  return (
    <div className={styles.editPlanContainer}>
      <Header title="여행 플랜 수정하기" />
      <form className={styles.formSection} onSubmit={onSave}>
        <div className={styles.formGroup}>
          <p className={styles.formTitle}>
            여행 플랜을
            <br />
            수정해 주세요
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>플랜 이름</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="플랜 이름을 입력해 주세요"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.inputField}
            />
            <span className={styles.charCount}>{`${name.length}/20`}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>공개 여부</label>
          <div className={styles.publicToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${isPublic ? styles.active : ""}`}
              onClick={() => setIsPublic(true)}
            >
              공개
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${!isPublic ? styles.active : ""}`}
              onClick={() => setIsPublic(false)}
            >
              비공개
            </button>
          </div>
          <p className={styles.toggleInfo}>
            {isPublic
              ? "플랜에 참여하지 않아도 모든 사람이 여행 계획을 볼 수 있어요!"
              : "플랜에 참여한 사람들만 여행 계획을 볼 수 있어요!"}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>여행 기간</label>
          <div className={styles.datePicker}>
            <input
              type="date"
              placeholder="시작일"
              value={startDate || ""}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.datePicker}>
            <input
              type="date"
              placeholder="종료일"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      </form>

      <div className={styles.buttonWrapper}>
        <CustomButton
          text={saving ? "저장 중..." : "변경 사항 저장"}
          onClick={onSave}
          disabled={saving}
          style={{
            width: "100%",
            height: "50px",
            backgroundColor: "var(--primary-color)",
            color: "var(--text-primary)",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
          }}
        />
      </div>
    </div>
  );
}
