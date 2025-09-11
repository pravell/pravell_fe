import React from 'react';
import styles from './ConfirmationModal.module.css';

const ConfirmationModal = ({
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmText = '확인', 
  cancelText = '취소',
  confirmButtonColor = '#dfdfdf',
  cancelButtonColor = '#000000', 
  confirmTextColor = '#000000', 
  cancelTextColor = '#ffffff', 
}) => {
  if (!isOpen) return null;

  const confirmButtonStyle = {
    backgroundColor: confirmButtonColor,
    color: confirmTextColor,
  };

  const cancelButtonStyle = {
    backgroundColor: cancelButtonColor,
    color: cancelTextColor,
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        <div className={styles.textSection}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.buttonSection}>
          <button className={styles.confirmButton} onClick={onConfirm} style={confirmButtonStyle}>
            {confirmText}
          </button>
          <button className={styles.cancelButton} onClick={onClose} style={cancelButtonStyle}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
