import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreatePlanModal.module.css';

const CreatePlanModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreatePlanClick = () => {
    onClose();
    navigate('/create-plan');
  };

  const handleJoinByCodeClick = () => {
    onClose();
    navigate('/join-by-code');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          X
        </button>
        <img src="/image/character6.png" alt="이모지" className={styles.emoji} />
        <p className={styles.modalTitle}>여행 플랜 생성하기</p>
        <button className={styles.createPlanButton} onClick={handleCreatePlanClick}>
          여행 플랜 생성하기
        </button>
        <button className={styles.inviteCodeButton} onClick={handleJoinByCodeClick}>
          초대 코드로 추가
        </button>
      </div>
    </div>
  );
};

export default CreatePlanModal;
