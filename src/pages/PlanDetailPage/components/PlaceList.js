import React from "react";
import styles from "../PlanDetailPage.module.css";

const dayKo = {
  Monday: "월",
  Tuesday: "화",
  Wednesday: "수",
  Thursday: "목",
  Friday: "금",
  Saturday: "토",
  Sunday: "일",
};

export default function PlaceList({ places, keyword, onSelect }) {
  const q = keyword.trim().toLowerCase();
  const filtered = q
    ? places.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.nickname || "").toLowerCase().includes(q) ||
          (p.address || "").toLowerCase().includes(q) ||
          (p.roadAddress || p.roadAddredd || "").toLowerCase().includes(q)
      )
    : places;

  return (
    <div className={styles.list}>
      {filtered.map((p) => {
        const mainTitle = p.title || p.nickname || "이름 없음";
        const subNick = p.title ? p.nickname : ""; // title이 없을 땐 중복 방지
        const road = p.roadAddress || p.roadAddredd || "";

        return (
          <div key={p.id} className={styles.item} onClick={() => onSelect(p)}>
            <div className={styles.itemHeader}>
              <div className={styles.itemHeaderText}>
                <h3 className={styles.itemTitleMain}>{mainTitle}</h3>
                {subNick ? <div className={styles.itemNick}>{subNick}</div> : null}
              </div>

              {p.mapUrl && (
                <a
                  href={p.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.naverLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  네이버 지도로 이동
                </a>
              )}
            </div>

            {p.address && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>주소</span>
                <span className={styles.rowValue}>{p.address}</span>
              </div>
            )}
            {road && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>도로명 주소</span>
                <span className={styles.rowValue}>{road}</span>
              </div>
            )}

            {Array.isArray(p.hours) && p.hours.length > 0 && (
              <div className={styles.hoursBlock}>
                <div className={styles.rowLabel}>영업 시간</div>
                <div className={styles.hoursList}>
                  {p.hours.map((h, i) => {
                    if (h === "정보 없음")
                      return (
                        <div key={i} className={styles.hourLine}>
                          정보 없음
                        </div>
                      );
                    const [d, t = ""] = String(h).split(": ");
                    return (
                      <div key={i} className={styles.hourLine}>
                        <span className={styles.hourDay}>{dayKo[d] ?? d}</span>
                        <span className={styles.hourTime}>{t}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {p.memo && <div className={styles.memo}>{p.memo}</div>}
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className={styles.empty}>저장된 장소가 없습니다. <br /> 장소 검색 후 저장해 주세요.</div>
      )}
    </div>
  );
}
