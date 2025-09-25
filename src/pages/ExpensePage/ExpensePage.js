import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ExpensePage.module.css";
import {
  getExpensesByPlan,
  parseApiError,
  getAccessToken,
  getPlanDetail,
} from "../../services/api";

import Header from "../../components/Header/Header";

export default function ExpensePage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState("");
  const token = getAccessToken();

  const fetchPlanName = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await getPlanDetail(planId, token);
      setPlanName(data?.name || "가계부");
    } catch (e) {
      console.error(e);
      setPlanName("가계부");
    }
  }, [planId, token]);

  const fetchExpenses = useCallback(async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const { data } = await getExpensesByPlan(planId, {}, token);
      setExpenses(data);
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message || "지출 내역을 불러오지 못했습니다.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [planId, token, navigate]);

  useEffect(() => {
    fetchPlanName();
    fetchExpenses();
  }, [fetchPlanName, fetchExpenses]);

  if (loading) {
    return <div className={styles.loading}>지출 내역을 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <Header
        title={`${planName} 가계부`}
        onBack={() => navigate(-1)}
      />
      <div className={styles.expenseList}>
        {expenses.length > 0 ? (
          expenses.map((expense, index) => (
            <div key={index} className={styles.expenseItem}>
              <div className={styles.expenseInfo}>
                <div className={styles.expenseTitle}>{expense.title}</div>
                <div className={styles.expenseAmount}>
                  {expense.amount.toLocaleString()}원
                </div>
              </div>
              <div className={styles.expenseDetails}>
                <div className={styles.expenseDescription}>
                  {expense.description}
                </div>
                <div className={styles.expenseDate}>
                  {new Date(expense.spentAt).toLocaleString()}
                </div>
                <div className={styles.paidBy}>
                  결제자: {expense.painByUserNickname}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyMessage}>
            등록된 지출 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
