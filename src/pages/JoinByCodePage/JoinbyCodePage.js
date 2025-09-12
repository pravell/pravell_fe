import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinByCodePage.module.css';
import axios from 'axios';
import CustomButton from '../../components/CustomButton/CustomButton';
import Header from '../../components/Header/Header';

const JoinByCodePage = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleJoinPlan = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/v1/plans/join?code=${code}`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      alert('여행 플랜에 성공적으로 참여했습니다!');
      navigate('/');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          alert('초대 코드가 올바르지 않거나 만료되었습니다.');
        } else if (status === 400 && data.message === '이미 플랜에 참여중인 유저입니다.') {
          alert(data.message);
        } else if (status === 403) {
          alert('해당 플랜에 참여가 불가능합니다.');
        } else if (status === 401) {
          alert('토큰이 올바르지 않습니다.');
        } else {
          alert(`오류: ${data.message}`);
        }
      } else {
        alert('네트워크 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className={styles.joinPageContainer}>
    <Header title="여행 플랜 생성하기" />
    <div className={styles.formSection}>
      <div className={styles.formGroup}>
        <p className={styles.formTitle}>여행 플랜에<br />참여해주세요</p>
      </div>
        
        <form onSubmit={handleJoinPlan} className={styles.joinForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>초대 코드</label>
            <input
              type="text"
              placeholder="초대 코드를 입력해 주세요"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={styles.inputField}
            />
          </div>
          
          <CustomButton
            text="여행 플랜에 참여하기"
            onClick={handleJoinPlan}
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
        </form>
      </div>
    </div>
  );
};

export default JoinByCodePage;
