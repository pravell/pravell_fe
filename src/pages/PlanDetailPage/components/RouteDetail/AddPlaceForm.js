import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function AddPlaceForm({
  styles, selectedPlace, addDate, nickname, memo,
  onOpenSelect, onChangeDate, onChangeNick, onChangeMemo, onSave, saving,
}) {
  return (
    <div className={styles.addFormWrap}>
      <div className={styles.addField}>
        <div className={styles.addLabel}>추가 할 장소</div>
        <CustomButton
          text={selectedPlace ? selectedPlace.title : "장소 선택하기"}
          onClick={onOpenSelect}
          width="100%" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px"
          backgroundColor="var(--secondary-color)" textColor="var(--quinary-color)"
        />
      </div>
      <div className={styles.addField}>
        <div className={styles.addLabel}>방문 할 날짜</div>
        <input type="date" className={styles.routeDatePicker} value={addDate}
          onChange={(e) => onChangeDate(e.target.value)} />
      </div>
      <div className={styles.addField}>
        <div className={styles.addLabel}>장소 별명</div>
        <div className={styles.inputWrapper}>
          <input className={`${styles.rowValueInput} ${styles.inputField}`} value={nickname} maxLength={20}
            placeholder="(선택) 장소 별명을 입력해 주세요" onChange={(e) => onChangeNick(e.target.value)} />
          <span className={styles.charCount}>{`${nickname.length}/20`}</span>
        </div>
      </div>
      <div className={styles.addField}>
        <div className={styles.addLabel}>장소 메모</div>
        <div className={styles.inputWrapper}>
          <input className={`${styles.rowValueInput} ${styles.inputField}`} value={memo} maxLength={50}
            placeholder="(선택) 장소 메모를 입력해 주세요" onChange={(e) => onChangeMemo(e.target.value)} />
          <span className={styles.charCount}>{`${memo.length}/50`}</span>
        </div>
      </div>
      <CustomButton text={saving ? "저장 중..." : "루트에 장소 추가"}
        onClick={saving ? undefined : onSave}
        width="100%" height="40px" fontSize="14px" fontWeight="700" borderRadius="8px"
        backgroundColor="var(--primary-color)" />
    </div>
  );
}
