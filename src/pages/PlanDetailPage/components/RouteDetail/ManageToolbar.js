import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function ManageToolbar({
  styles, addMode, manageMode, onClickAdd, onToggleManage, onDeleteSelected, deleteLoading,
}) {
  if (addMode) return null;
  return (
    <>
      <div className={styles.routeDetailDateRow} style={{ display: "flex", gap: 8 }}>
        <CustomButton text="장소 추가" onClick={onClickAdd}
          width="100%" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px" />
        <CustomButton text={manageMode ? "편집 완료" : "장소 편집"} onClick={onToggleManage}
          width="120px" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px" backgroundColor="#f1f1f1" />
      </div>
      {manageMode && (
        <div className={styles.routeDetailDateRow} style={{ display: "flex", gap: 8 }}>
          <CustomButton text={deleteLoading ? "삭제 중..." : "선택 삭제"}
            onClick={deleteLoading ? undefined : onDeleteSelected}
            width="100%" height="38px" fontSize="13px" fontWeight="700" borderRadius="8px"
            backgroundColor="#ffe3e3" textColor="#b00020" />
        </div>
      )}
    </>
  );
}
