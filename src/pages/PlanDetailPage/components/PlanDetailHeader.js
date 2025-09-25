import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../../components/Header/Header.module.css";

export default function PlanDetailHeader({
  title = "내 여행 플랜",
  isLoggedIn = false,
  isMember = false,
  handlePlusButtonClick,
  left = null,
  right = null,
  onClickSettings,
  planId,
}) {
  const navigate = useNavigate();

  const handleWalletClick = () => {
    navigate(`/plan/${planId}/expense`);
  };

  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftComponent}>
        {left ??
          (isLoggedIn && isMember ? (
            <button className={styles.iconButton} onClick={handleWalletClick}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12V6.5C21 5.67157 20.3284 5 19.5 5H4.5C3.67157 5 3 5.67157 3 6.5V12M21 12V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12C15 13.1046 14.1046 14 13 14C11.8954 14 11 13.1046 11 12C11 10.8954 11.8954 10 13 10C14.1046 10 15 10.8954 15 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null)}
      </div>
      <h1 className={styles.pageTitle}>{title}</h1>
      <div className={styles.rightComponent}>
        {right ??
          (onClickSettings ? (
            <button className={styles.plusButton} onClick={onClickSettings}>
              <img src="/image/setting.svg" alt="설정" width="22" height="22" />
            </button>
          ) : isLoggedIn ? (
            <button
              className={styles.plusButton}
              onClick={handlePlusButtonClick}
            >
              +
            </button>
          ) : null)}
      </div>
    </div>
  );
}
