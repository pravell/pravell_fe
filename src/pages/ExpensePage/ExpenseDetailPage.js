import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ExpenseDetailPage.module.css";
import {
  getExpenseDetail,
  deleteExpense,
  updateExpense,
  parseApiError,
  getAccessToken,
  getPlanDetail,
} from "../../services/api";

import Header from "../../components/Header/Header";
import CustomButton from "../../components/CustomButton/CustomButton";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

export default function ExpenseDetailPage() {
  const { planId, expenseId } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [members, setMembers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const token = getAccessToken();

  const fetchExpenseDetail = useCallback(async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const { data } = await getExpenseDetail(expenseId, token);
      setExpense(data);
      setEditForm({
        title: data.title,
        amount: data.amount,
        paidByUserId: data.paidByUserId,
        spentAt: new Date(data.spentAt).toISOString().slice(0, 16),
        description: data.description,
      });

      const { data: planData } = await getPlanDetail(planId, token);
      const allMembers = [
        { memberId: planData.ownerId, nickname: planData.ownerNickname },
        ...(Array.isArray(planData?.member) ? planData.member : []),
      ];
      setMembers(allMembers);
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message || "지출 내역을 불러오지 못했습니다.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [expenseId, planId, token, navigate]);

  useEffect(() => {
    fetchExpenseDetail();
  }, [fetchExpenseDetail]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expenseId, token);
      alert("지출 내역이 삭제되었습니다.");
      navigate(-1);
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message || "지출 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdate = async () => {
    if (!editForm.title) return alert("타이틀을 입력해주세요.");
    if (!editForm.amount) return alert("결제 금액을 입력해주세요.");
    if (!editForm.paidByUserId) return alert("결제자를 선택해주세요.");
    if (!editForm.spentAt) return alert("결제 시간을 입력해주세요.");
    
    setIsUpdating(true);
    try {
      const payload = {
        title: editForm.title,
        amount: Number(editForm.amount),
        paidByUserId: editForm.paidByUserId,
        spentAt: editForm.spentAt,
        description: editForm.description,
      };

      await updateExpense(expenseId, payload, token);
      alert("지출 내역이 수정되었습니다.");
      setIsEditing(false);
      fetchExpenseDetail();
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message || "지출 수정에 실패했습니다.");
    } finally {
      setIsUpdating(false);
      setShowUpdateConfirm(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>지출 내역을 불러오는 중...</div>;
  }

  if (!expense) {
    return <div className={styles.empty}>지출 내역을 찾을 수 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <Header title="지출 상세" onBack={() => navigate(-1)} />

      <div className={styles.detailContainer}>
        {isEditing ? (
          <div className={styles.formContainer}>
            <div className={styles.formField}>
              <label>타이틀</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                maxLength={50}
              />
            </div>
            <div className={styles.formField}>
              <label>금액 (원)</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div className={styles.formField}>
              <label>결제자</label>
              <select
                value={editForm.paidByUserId}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    paidByUserId: e.target.value,
                  }))
                }
              >
                {members.map((member) => (
                  <option key={member.memberId} value={member.memberId}>
                    {member.nickname}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>결제 시간</label>
              <input
                type="datetime-local"
                value={editForm.spentAt}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, spentAt: e.target.value }))
                }
              />
            </div>
            <div className={styles.formField}>
              <label>설명</label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                maxLength={255}
              />
            </div>
            <div className={styles.formActions}>
              <CustomButton
                text="취소"
                onClick={() => setIsEditing(false)}
                backgroundColor="#eee"
                textColor="#000"
                width="100px"
              />
              <CustomButton
                text="수정 완료"
                onClick={() => setShowUpdateConfirm(true)}
                width="100px"
                backgroundColor="var(--primary-color)"
              />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.detailItem}>
              <span className={styles.label}>타이틀</span>
              <span className={styles.value}>{expense.title}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>금액</span>
              <span className={styles.value}>
                {expense.amount.toLocaleString()}원
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>결제자</span>
              <span className={styles.value}>{expense.paidByUserNickname}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>결제 시간</span>
              <span className={styles.value}>
                {new Date(expense.spentAt).toLocaleString()}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>설명</span>
              <span className={styles.value}>
                {expense.description || "내용 없음"}
              </span>
            </div>
            <div className={styles.actions}>
              <CustomButton
                text="삭제"
                onClick={() => setShowDeleteConfirm(true)}
                backgroundColor="var(--tertiary-color)"
                textColor="var(--text-secondary)"
              />
              <CustomButton
                text="수정"
                onClick={() => setIsEditing(true)}
                backgroundColor="var(--primary-color)"
                textColor="var(--text-primary)"
              />
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="지출 삭제"
        description="정말로 이 지출 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText={isDeleting ? "삭제 중..." : "삭제"}
        cancelText="취소"
        confirmButtonColor="var(--tertiary-color)"
        confirmTextColor="var(--text-secondary)"
        cancelButtonColor="#000000"
        cancelTextColor="#ffffff"
      />

      <ConfirmationModal
        isOpen={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={handleUpdate}
        title="지출 수정"
        description="지출 내역을 수정하시겠습니까?"
        confirmText={isUpdating ? "수정 중..." : "수정"}
        cancelText="취소"
        confirmButtonColor="var(--primary-color)"
        confirmTextColor="var(--text-primary)"
        cancelButtonColor="#000000"
        cancelTextColor="#ffffff"
      />
    </div>
  );
}
