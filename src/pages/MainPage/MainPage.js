// src/pages/MainPage/MainPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MainPage.module.css";
import CustomButton from "../../components/CustomButton/CustomButton";
import CreatePlanModal from "../../components/CreatePlanModal/CreatePlanModal";
import MainPageHeader from "./MainPageHeader";
import API, { getAccessToken } from "../../services/api"; // ✅ axios 대신 API 사용

const MainPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = getAccessToken();
    if (accessToken) {
      // 토큰이 있으면 목록 요청 시도 (만료면 인터셉터가 자동 갱신 후 재시도)
      fetchTravelPlans();
    } else {
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }, []);

  const fetchTravelPlans = async () => {
    try {
      const { data } = await API.get(`/v1/plans`); // ✅ Authorization 자동 부착 + 자동 리프레시
      setPlans(data || []);
      setIsLoggedIn(true);
    } catch (error) {
      // 리프레시도 실패(완전 만료)인 경우에만 여기로 떨어짐
      if (error?.response?.status === 401) {
        setIsLoggedIn(false);
        // 토큰 정리는 인터셉터가 이미 했음
        navigate("/login");
      } else {
        console.error("플랜 목록 조회 오류:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => navigate("/login");
  const handlePlusButtonClick = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  const handlePlanClick = (plan) => {
    navigate(`/plan/${plan.planId}`, { state: { planTitle: plan.planName } });
  };

  const getPlanStatus = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today > end) return "여행 종료";
    if (today >= start && today <= end) return "여행 중";
    const daysDiffStart = Math.ceil((start - today) / (1000 * 3600 * 24));
    return `D-${daysDiffStart}`;
  };

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className={styles.authContainer}>
          <img
            src="/image/character7.png"
            alt="로그인 캐릭터"
            className={styles.characterImage}
          />
          <p className={styles.messageText}>로그인을 먼저 해주세요!</p>
          <CustomButton
            text="로그인 하러 가기"
            onClick={handleLoginClick}
            style={{
              backgroundColor: "var(--primary-color)",
              color: "var(--text-primary)",
              marginTop: "20px",
            }}
          />
        </div>
      );
    }

    if ((plans || []).length === 0) {
      return (
        <div className={styles.emptyPlanContainer}>
          <img
            src="/image/character5.png"
            alt="플랜 없음 캐릭터"
            className={styles.characterImage}
          />
          <p className={styles.messageText}>
            여행 플랜이 없어요!
            <br />
            여행 플랜을 추가해주세요!
          </p>
          <CustomButton
            text="+ 여행 플랜 생성하기"
            onClick={handlePlusButtonClick}
            style={{
              backgroundColor: "var(--primary-color)",
              color: "var(--text-primary)",
              marginTop: "20px",
            }}
          />
        </div>
      );
    }

    const sortedPlans = [...plans].sort((a, b) => {
      const aStatus = getPlanStatus(a.startDate, a.endDate);
      const bStatus = getPlanStatus(b.startDate, b.endDate);

      if (aStatus === "여행 중" && bStatus !== "여행 중") return -1;
      if (aStatus !== "여행 중" && bStatus === "여행 중") return 1;
      if (aStatus === "여행 종료" && bStatus !== "여행 종료") return 1;
      if (aStatus !== "여행 종료" && bStatus === "여행 종료") return -1;

      const aDays = aStatus.startsWith("D-")
        ? parseInt(aStatus.substring(2), 10)
        : Infinity;
      const bDays = bStatus.startsWith("D-")
        ? parseInt(bStatus.substring(2), 10)
        : Infinity;
      return aDays - bDays;
    });

    return (
      <div className={styles.travelListContainer}>
        {sortedPlans.map((plan) => {
          const statusText = getPlanStatus(plan.startDate, plan.endDate);
          const isFinished = statusText === "여행 종료";

          return (
            <div
              key={plan.planId}
              className={styles.travelPlanItem}
              onClick={() => handlePlanClick(plan)}
            >
              <div className={styles.planInfo}>
                <p className={styles.planTitle}>{plan.planName}</p>
                <p className={styles.planMembers}>{plan.members.join(", ")}</p>
                <p className={styles.planDate}>
                  {`${plan.startDate} ~ ${plan.endDate}`}
                </p>
              </div>
              <div className={styles.planStatusContainer}>
                <span
                  className={styles.planStatus}
                  style={{
                    backgroundColor: isFinished
                      ? "var(--secondary-color)"
                      : "var(--primary-color)",
                  }}
                >
                  {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.mainPageContainer}>
      <MainPageHeader
        isLoggedIn={isLoggedIn}
        handlePlusButtonClick={handlePlusButtonClick}
      />
      {renderContent()}
      <CreatePlanModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
};

export default MainPage;
