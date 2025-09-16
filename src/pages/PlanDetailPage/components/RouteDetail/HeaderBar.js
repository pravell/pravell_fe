import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function HeaderBar({
  styles,
  onBack,
  routeTitle,
  addMode,
  routeEditMode,
  onClickRouteEdit,
  onDeleteRoute,
  routeDeleting,
}) {
  return (
    <>
      <div className={styles.routeHeaderTop}>
        <button className={styles.detailBackBtn} onClick={onBack} aria-label="뒤로">‹</button>
      </div>
      <div className={styles.routeHeaderMain}>
        <h3 className={styles.routeDetailTitle}>{routeTitle}</h3>
        {!addMode && !routeEditMode && (
          <div style={{ display: "flex", gap: 8 }}>
            <CustomButton text="루트 수정" onClick={onClickRouteEdit}
              width="92px" height="34px" fontSize="13px" fontWeight="700" borderRadius="8px" />
            <CustomButton text={routeDeleting ? "삭제 중..." : "루트 삭제"}
              onClick={routeDeleting ? undefined : onDeleteRoute}
              width="92px" height="34px" fontSize="13px" fontWeight="700"
              borderRadius="8px" backgroundColor="#bf1041" textColor="#fff" />
          </div>
        )}
      </div>
    </>
  );
}
