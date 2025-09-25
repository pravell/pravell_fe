import React from 'react';
import styles from './Header.module.css';

const Header = ({ title, onBack }) => {
  return (
    <div className={styles.headerContainer}>
      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          &lsaquo;
        </button>
      )}
      <h1 className={styles.pageTitle}>{title}</h1>
    </div>
  );
};

export default Header;
