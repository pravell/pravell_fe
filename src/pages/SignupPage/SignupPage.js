import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignupPage.module.css';
import axios from 'axios';
import CustomButton from '../../components/CustomButton/CustomButton';

const SignupPage = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/v1/auth/sign-up`, {
        id,
        password,
        nickname,
      });

      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      navigate('/');
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 409){
          alert(data.message);
        } else if (status === 400 && data && data.message) {
          alert(data.message);
        } else {
          alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        alert('네트워크 오류가 발생했습니다.');
      }
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles.signupPageContainer}>
      <img src="/image/logo.png" alt="PRAVELL 로고" className={styles.logo} />

      <form onSubmit={handleSignup} className={styles.signupForm}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>아이디</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="아이디를 입력해 주세요"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className={styles.inputField}
            />
            <span className={styles.charCount}>{`${id.length}/30`}</span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.inputField}
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>닉네임</label>
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
          text="회원가입"
          onClick={handleSignup}
          style={{
            width: '100%',
            height: '50px',
            marginTop: '20px',
            backgroundColor: 'var(--primary-color)',
            color: 'var(--text-primary)',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '700',
          }}
        />
      </form>

      <button onClick={handleLogin} className={styles.loginButton}>
        로그인
      </button>
    </div>
  );
};

export default SignupPage;
