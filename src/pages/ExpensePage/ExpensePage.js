import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ExpensePage.module.css";
import { getExpensesByPlan, parseApiError, getAccessToken, getPlanDetail, createExpense } from "../../services/api";

import Header from "../../components/Header/Header";
import CustomButton from "../../components/CustomButton/CustomButton";

export default function ExpensePage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState("");
  const [members, setMembers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    paidByUserId: "",
    spentAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16),
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [settlementResult, setSettlementResult] = useState(null);
  const token = getAccessToken();

  const fetchPlanData = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await getPlanDetail(planId, token);
      setPlanName(data?.name || "가계부");
      const allMembers = [
        { memberId: data.ownerId, nickname: data.ownerNickname },
        ...(Array.isArray(data?.member) ? data.member : []),
      ];
      setMembers(allMembers);
      if (allMembers.length > 0) {
        setExpenseForm((prev) => ({ ...prev, paidByUserId: allMembers[0].memberId }));
      }
    } catch (e) {
      console.error(e);
      setPlanName("가계부");
      setMembers([]);
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
    fetchPlanData();
    fetchExpenses();
  }, [fetchPlanData, fetchExpenses]);

  const handleCreateExpense = async () => {
    if (!expenseForm.title) return alert("타이틀을 입력해주세요.");
    if (!expenseForm.amount) return alert("결제 금액을 입력해주세요.");
    if (!expenseForm.paidByUserId) return alert("결제자를 선택해주세요.");
    if (!expenseForm.spentAt) return alert("결제 시간을 입력해주세요.");

    const rawAmount = expenseForm.amount.replace(/,/g, '');
    if (isNaN(Number(rawAmount)))
      return alert("결제 금액은 숫자여야 합니다.");

    const payload = {
      ...expenseForm,
      amount: Number(rawAmount),
    };

    try {
      setIsCreating(true);
      await createExpense(planId, payload, token);
      setFormOpen(false);
      setExpenseForm({
        title: "",
        amount: "",
        paidByUserId: members[0]?.memberId || "",
        spentAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16),
        description: "",
      });
      fetchExpenses();
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message || "지출 추가에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const calculateSettlement = () => {
    if (!expenses.length || !members.length) {
      setSettlementResult(null);
      return;
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPersonAmount = totalAmount / members.length;

    const memberBalances = members.reduce((acc, member) => {
      acc[member.memberId] = {
        nickname: member.nickname,
        paid: 0,
        balance: 0,
      };
      return acc;
    }, {});

    expenses.forEach((exp) => {
      if (memberBalances[exp.paidByUserId]) {
        memberBalances[exp.paidByUserId].paid += exp.amount;
      }
    });

    members.forEach((member) => {
      memberBalances[member.memberId].balance =
        memberBalances[member.memberId].paid - perPersonAmount;
    });

    const debtors = Object.values(memberBalances).filter((m) => m.balance < 0);
    const creditors = Object.values(memberBalances).filter(
      (m) => m.balance > 0
    );

    const transactions = [];
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];
      const debt = -debtor.balance;
      const credit = creditor.balance;

      const settledAmount = Math.min(debt, credit);

      transactions.push({
        from: debtor.nickname,
        to: creditor.nickname,
        amount: settledAmount,
      });

      debtor.balance += settledAmount;
      creditor.balance -= settledAmount;

      if (debtor.balance === 0) debtorIdx++;
      if (creditor.balance === 0) creditorIdx++;
    }

    setSettlementResult({
      totalAmount,
      perPersonAmount,
      memberBalances,
      transactions,
    });
  };

  if (loading) {
    return <div className={styles.loading}>지출 내역을 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <Header title={`${planName} 가계부`} onBack={() => navigate(-1)} />

      <div className={styles.topSection}>
        <CustomButton
          text="지출 추가"
          onClick={() => setFormOpen(true)}
          width="100%"
        />
        <div style={{ marginTop: '10px' }}>
          <CustomButton
            text="정산하기"
            onClick={calculateSettlement}
            width="100%"
            backgroundColor="var(--secondary-color)"
            textColor="var(--quinary-color)"
          />
        </div>
      </div>

      {formOpen && (
        <div className={styles.formContainer}>
          <div className={styles.formTitle}>새 지출 추가</div>
          <div className={styles.formField}>
            <label>타이틀</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={50}
                className={styles.inputField}
              />
              <span className={styles.charCount}>{`${expenseForm.title.length}/50`}</span>
            </div>
          </div>
          <div className={styles.formField}>
            <label>금액 (원)</label>
            <input
              type="text"
              value={expenseForm.amount}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                if (!isNaN(Number(rawValue))) {
                  setExpenseForm(prev => ({ ...prev, amount: Number(rawValue).toLocaleString() }));
                }
              }}
              className={styles.inputField}
              inputMode="numeric"
            />
          </div>
          <div className={styles.formField}>
            <label>결제자</label>
            <select
              value={expenseForm.paidByUserId}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, paidByUserId: e.target.value }))}
              className={styles.inputField}
            >
              {members.map(member => (
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
              value={expenseForm.spentAt}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, spentAt: e.target.value }))}
              className={styles.inputField}
            />
          </div>
          <div className={styles.formField}>
            <label>설명 (선택)</label>
            <div className={styles.inputWrapper}>
              <textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                maxLength={255}
                className={styles.inputField}
                rows={3}
              />
              <span className={styles.charCount}>{`${expenseForm.description.length}/255`}</span>
            </div>
          </div>
          <div className={styles.formActions}>
            <CustomButton
              text="취소"
              onClick={() => setFormOpen(false)}
              backgroundColor="#eee"
              textColor="#000"
              width="100px"
            />
            <CustomButton
              text={isCreating ? "추가 중..." : "추가"}
              onClick={handleCreateExpense}
              disabled={isCreating}
              width="100px"
              backgroundColor="var(--primary-color)"
            />
          </div>
        </div>
      )}

      {settlementResult && (
        <div className={styles.settlementContainer}>
          <div className={styles.settlementHeader}>
            <div className={styles.settlementTitle}>정산 결과</div>
            <button className={styles.closeBtn} onClick={() => setSettlementResult(null)}>X</button>
          </div>
          <div className={styles.summarySection}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>총 지출 금액</span>
              <span className={styles.summaryValue}>{settlementResult.totalAmount.toLocaleString()}원</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>1인당 부담액</span>
              <span className={styles.summaryValue}>{Math.round(settlementResult.perPersonAmount).toLocaleString()}원</span>
            </div>
          </div>

          <div className={styles.balancesSection}>
            <div className={styles.balancesTitle}>멤버별 정산 현황</div>
            {Object.values(settlementResult.memberBalances).map(member => (
              <div key={member.nickname} className={styles.balanceItem}>
                <span className={styles.balanceNickname}>{member.nickname}</span>
                <span className={styles.balancePaid}>
                  {member.paid.toLocaleString()}원 지출
                </span>
              </div>
            ))}
          </div>

          {settlementResult.transactions.length > 0 && (
            <div className={styles.transactionsSection}>
              <div className={styles.transactionsTitle}>최종 송금</div>
              {settlementResult.transactions.map((t, index) => (
                <div key={index} className={styles.transactionItem}>
                  <div className={styles.transactionFrom}>{t.from}</div>
                  <div className={styles.transactionArrow}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                  <div className={styles.transactionTo}>{t.to}</div>
                  <div className={styles.transactionAmount}>
                    {Math.round(t.amount).toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.expenseList}>
        {expenses.length > 0 ? (
          expenses.map((expense, index) => (
            <div
              key={expense.expenseId || index}
              className={styles.expenseItem}
              onClick={() => navigate(`/plan/${planId}/expense/${expense.expenseId}`)}
            >
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
                  결제자: {expense.paidByUserNickname}
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
