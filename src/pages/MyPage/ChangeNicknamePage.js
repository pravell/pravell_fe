import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ChangeNicknamePage.module.css';
import Header from '../../components/Header/Header';
import CustomButton from '../../components/CustomButton/CustomButton';

const ChangeNicknamePage = () => {
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleNicknameChange = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/v1/users/me`, { nickname }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      navigate('/my');
    } catch (error) {
      if (error.response) {
        alert(`오류: ${error.response.data.message}`);
      } else {
        alert('네트워크 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      <Header title="닉네임 변경하기" />
      <div className={styles.changeNicknameContainer}>
        <h1 className={styles.pageTitle}>변경 할 닉네임을 <br /> 입력해 주세요</h1>
        <form onSubmit={handleNicknameChange} className={styles.nicknameForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>변경 할 닉네임</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="닉네임을 입력해 주세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={styles.inputField}
              />
              <span className={styles.charCount}>{`${nickname.length}/30`}</span>
            </div>
          </div>
          <CustomButton
            text="닉네임 변경하기"
            onClick={handleNicknameChange}
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
    </>
  );
};

export default ChangeNicknamePage;
