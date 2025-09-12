import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MainPage.module.css';
import CustomButton from '../../components/CustomButton/CustomButton';
import CreatePlanModal from '../../components/CreatePlanModal/CreatePlanModal';
import MainPageHeader from './MainPageHeader';
import axios from 'axios';

const MainPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };

  useEffect(() => {
    const accessToken = getAccessToken();
    if (accessToken) {
      setIsLoggedIn(true);
      fetchTravelPlans(accessToken);
    } else {
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }, []);

  const fetchTravelPlans = async (token) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/v1/plans`, {
            headers: {
              Authorization: `Bearer `+ token
            }
          });
      setPlans(response.data);
      setIsLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setIsLoggedIn(false);
        localStorage.removeItem('accessToken'); 
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        console.error('API 호출 중 오류 발생:', error);
      }
      setIsLoading(false);
    }
  };
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handlePlusButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handlePlanClick = (planId) => {
    navigate(`/plan/${planId}/map`);
  };

  const getPlanStatus = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const timeDiffStart = start.getTime() - today.getTime();
    const daysDiffStart = Math.ceil(timeDiffStart / (1000 * 3600 * 24));
    
    const timeDiffEnd = end.getTime() - today.getTime();
    const daysDiffEnd = Math.ceil(timeDiffEnd / (1000 * 3600 * 24));

    if (today > end) {
      return '여행 종료';
    } else if (today >= start && today <= end) {
      return '여행 중';
    } else {
      return `D-${daysDiffStart}`;
    }
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
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-primary)',
              marginTop: '20px'
            }}
          />
        </div>
      );
    } else if (plans.length === 0) {
      return (
        <div className={styles.emptyPlanContainer}>
          <img
            src="/image/character5.png"
            alt="플랜 없음 캐릭터"
            className={styles.characterImage}
          />
          <p className={styles.messageText}>
            여행 플랜이 없어요!<br />여행 플랜을 추가해주세요!
          </p>
          <CustomButton
            text="+ 여행 플랜 생성하기"
            onClick={handlePlusButtonClick}
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-primary)',
              marginTop: '20px'
            }}
          />
        </div>
      );
    } else {
      const sortedPlans = [...plans].sort((a, b) => {
        const aStatus = getPlanStatus(a.startDate, a.endDate);
        const bStatus = getPlanStatus(b.startDate, b.endDate);

        if (aStatus === '여행 중' && bStatus !== '여행 중') {
          return -1;
        }
        if (aStatus !== '여행 중' && bStatus === '여행 중') {
          return 1;
        }
        if (aStatus === '여행 종료' && bStatus !== '여행 종료') {
          return 1;
        }
        if (aStatus !== '여행 종료' && bStatus === '여행 종료') {
          return -1;
        }
        const aDays = aStatus.startsWith('D-') ? parseInt(aStatus.substring(2)) : Infinity;
        const bDays = bStatus.startsWith('D-') ? parseInt(bStatus.substring(2)) : Infinity;
        return aDays - bDays;
      });

      return (
        <div className={styles.travelListContainer}>
          {sortedPlans.map(plan => {
            const statusText = getPlanStatus(plan.startDate, plan.endDate);
            const isFinished = statusText === '여행 종료';
            
            return (
              <div key={plan.planId} className={styles.travelPlanItem} onClick={ () => handlePlanClick(plan.planId) }>
                <div className={styles.planInfo}>
                  <p className={styles.planTitle}>{plan.planName}</p>
                  <p className={styles.planMembers}>{plan.members.join(', ')}</p>
                  <p className={styles.planDate}>{`${plan.startDate} ~ ${plan.endDate}`}</p>
                </div>
                <div className={styles.planStatusContainer}>
                  <span className={styles.planStatus} style={{ backgroundColor: isFinished ? 'var(--secondary-color)' : 'var(--primary-color)' }}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className={styles.mainPageContainer}>
      <MainPageHeader isLoggedIn={isLoggedIn} handlePlusButtonClick={handlePlusButtonClick} />
      {renderContent()}
      
      <CreatePlanModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
};

export default MainPage;
