import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function EditRouteForm({
  styles, routeName, routeDesc, onChangeName, onChangeDesc, onSave, onCancel, saving,
}) {
  return (
    <div className={styles.addFormWrap}>
      <div className={styles.addField}>
        <div className={styles.addLabel}>루트 이름</div>
        <div className={styles.inputWrapper}>
          <input className={`${styles.rowValueInput} ${styles.inputField}`}
            value={routeName} maxLength={30}
            onChange={(e) => onChangeName(e.target.value)} placeholder="루트 이름 (2~30자)" />
          <span className={styles.charCount}>{`${routeName.length}/30`}</span>
        </div>
      </div>
      <div className={styles.addField}>
        <div className={styles.addLabel}>루트 설명</div>
        <div className={styles.inputWrapper}>
          <input className={`${styles.rowValueInput} ${styles.inputField}`}
            value={routeDesc} maxLength={50}
            onChange={(e) => onChangeDesc(e.target.value)} placeholder="루트 설명 (2~50자)" />
          <span className={styles.charCount}>{`${routeDesc.length}/50`}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <CustomButton text={saving ? "저장 중..." : "저장"}
          onClick={saving ? undefined : onSave}
          width="100%" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px"
          backgroundColor="var(--primary-color)" />
        <CustomButton text="취소" onClick={onCancel}
          width="110px" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px" backgroundColor="#eee" />
      </div>
    </div>
  );
}
