import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function SelectPlaceList({ styles, selectLoading, planPlaces, onSelect }) {
  return (
    <div className={styles.selectListWrap}>
      <div className={styles.selectHint}>선택하고 싶은 장소가 없으면 먼저 장소를 저장해 주세요!</div>
      {selectLoading ? (
        <div className={styles.empty}>불러오는 중…</div>
      ) : planPlaces.length ? (
        <ul className={styles.planPlaceList}>
          {planPlaces.map((pp) => (
            <li key={pp.id} className={styles.planPlaceItem}>
              <div className={styles.planPlaceInfo}>
                <div className={styles.planPlaceTitleRow}>
                  <span className={styles.planPlaceTitle}>{pp.title || "(제목 없음)"}</span>
                  {pp.nickname ? <span className={styles.planPlaceNick}>{pp.nickname}</span> : null}
                </div>
                <div className={styles.planPlaceAddr}>{pp.address || ""}</div>
                <div className={styles.planPlaceAddr}>{pp.roadAddress || ""}</div>
                {pp.link ? (
                  <a className={styles.naverLink} href={pp.link} target="_blank" rel="noreferrer">네이버 지도로 이동</a>
                ) : null}
              </div>
              <CustomButton text="선택" onClick={() => onSelect(pp)}
                width="64px" height="32px" fontSize="13px" fontWeight="700" borderRadius="8px"
                backgroundColor="var(--primary-color)" textColor="var(--text-secondary)" />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>저장된 장소가 없습니다.</div>
      )}
    </div>
  );
}
