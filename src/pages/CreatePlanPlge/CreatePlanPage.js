import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreatePlanPage.module.css';
import axios from 'axios';
import CustomButton from '../../components/CustomButton/CustomButton';
import Header from '../../components/Header/Header';

const CreatePlanPage = () => {
  const [planName, setPlanName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const handleCreatePlan = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/v1/plans`, {
        name: planName,
        isPublic,
        startDate,
        endDate,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      navigate('/');
    } catch (error) {
      if (error.response) {
        alert(`오류: ${error.response.data.message}`);
      } else {
        alert('네트워크 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className={styles.createPlanContainer}>
      <Header title="여행 플랜 생성하기" />
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <p className={styles.formTitle}>여행 플랜을<br />생성해 주세요</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>플랜 이름</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="플랜 이름을 입력해 주세요"
              maxLength={20}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className={styles.inputField}
            />
            <span className={styles.charCount}>{`${planName.length}/20`}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>공개 여부</label>
          <div className={styles.publicToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${isPublic ? styles.active : ''}`}
              onClick={() => setIsPublic(true)}
            >
              공개
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${!isPublic ? styles.active : ''}`}
              onClick={() => setIsPublic(false)}
            >
              비공개
            </button>
          </div>
          <p className={styles.toggleInfo}>
            {isPublic 
              ? '플랜에 참여하지 않아도 모든 사람이 여행 계획을 볼 수 있어요!' 
              : '플랜에 참여한 사람들만 여행 계획을 볼 수 있어요!'}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>여행 기간</label>
          <div className={styles.datePicker}>
            <input
              type="date"
              placeholder="시작일"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.datePicker}>
            <input
              type="date"
              placeholder="종료일"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.buttonWrapper}>
        <CustomButton
          text="여행 플랜 생성하기"
          onClick={handleCreatePlan}
          style={{
            width: '100%',
            height: '50px',
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-primary)',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '700',
          }}
        />
      </div>
    </div>
  );
};

export default CreatePlanPage;
