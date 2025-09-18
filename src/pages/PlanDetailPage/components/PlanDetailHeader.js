import React from "react";
import styles from "../../../components/Header/Header.module.css";

export default function PlanDetailHeader({
  title = "내 여행 플랜",
  isLoggedIn = false,
  handlePlusButtonClick,
  left = null,
  right = null,
  onClickSettings,
}) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftComponent}>{left}</div>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.rightComponent}>
        {right ??
          (onClickSettings ? (
            <button className={styles.plusButton} onClick={onClickSettings}>
              <img src="/image/setting.svg" alt="설정" width="22" height="22" />
            </button>
          ) : isLoggedIn ? (
            <button className={styles.plusButton} onClick={handlePlusButtonClick}>
              +
            </button>
          ) : null)}
      </div>
    </div>
  );
}
