import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyPage.module.css';
import CustomButton from '../../components/CustomButton/CustomButton';
import Header from '../../components/Header/Header';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

import API, { clearTokens } from '../../services/api';

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data } = await API.get('/v1/users/me');
        setUser(data);
        setIsLoggedIn(true);
      } catch (error) {
        setIsLoggedIn(false);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await API.post('/v1/auth/sign-out'); 
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      clearTokens();
      setIsLogoutModalOpen(false);
      navigate('/login');
    }
  };

  const handleWithdrawal = async () => {
    try {
      await API.delete('/v1/users/me');
      clearTokens();
      navigate('/login');
    } catch (error) {
      if (error?.response?.status === 401) {
        alert('로그인이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
        clearTokens();
        navigate('/login');
      } else {
        alert('탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleNicknameChangeClick = () => {
    navigate('/change-nickname');
  };

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <>
      <Header title="내 프로필" />
      <div className={styles.myPageContainer}>
        {!isLoggedIn ? (
          <div className={styles.authContainer}>
            <img src="/image/character1.png" alt="로그인 캐릭터" className={styles.characterImage} />
            <p className={styles.messageText}>로그인을 먼저 해주세요!</p>
            <CustomButton
              text="로그인 하러 가기"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                marginTop: '20px',
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        ) : (
          <div className={styles.profileContainer}>
            <div className={styles.userInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>아이디</span>
                <span className={styles.infoValue}>{user?.userId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>닉네임</span>
                <span className={styles.infoValue}>{user?.nickname}</span>
              </div>
            </div>

            <div className={styles.accountSection}>
              <h2 className={styles.sectionTitle}>계정</h2>
              <ul className={styles.menuList}>
                <li className={styles.menuItem} onClick={handleNicknameChangeClick}>닉네임 변경</li>
                <li className={styles.menuItem} onClick={() => setIsLogoutModalOpen(true)}>로그아웃</li>
                <li
                  className={styles.menuItem}
                  style={{ color: 'var(--tertiary-color)' }}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  탈퇴
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="닫기"
        confirmButtonColor="var(--secondary-color)"
        cancelButtonColor="#000000"
        confirmTextColor="var(--text-secondary)"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleWithdrawal}
        title="정말 탈퇴하시겠습니까?"
        description="탈퇴 후에는 모든 정보가 삭제되며 되돌릴 수 없습니다."
        confirmText="탈퇴하기"
        cancelText="닫기"
        confirmButtonColor="var(--tertiary-color)"
        cancelButtonColor="#000000"
        confirmTextColor="var(--text-secondary)"
      />
    </>
  );
};

export default MyPage;
