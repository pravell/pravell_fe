import React from 'react';
import styles from '../../components/Header/Header.module.css';

const MainPageHeader = ({ isLoggedIn, handlePlusButtonClick }) => {
    return (
      <div className={styles.headerContainer}>
        <div className={styles.leftComponent}>
        </div>
        <h1 className={styles.pageTitle}>내 여행 플랜</h1>
        <div className={styles.rightComponent}>
        {isLoggedIn && (
            <button className={styles.plusButton} onClick={handlePlusButtonClick}>
              +
            </button>
          )}
        </div>
      </div>
    );
  };

export default MainPageHeader;
