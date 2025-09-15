import React from "react";
import styles from "../PlanDetailPage.module.css";

export default function SearchBar({ keyword, setKeyword, onSearch }) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="검색 할 키워드를 입력하세요."
        className={styles.searchInput}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
      />
      <button
        className={styles.searchBtn}
        onClick={onSearch}
        aria-label="검색"
      >
        <img
          src="/image/search-icon.png"
          alt="검색"
          className={styles.searchIcon}
        />
      </button>
    </div>
  );
}
