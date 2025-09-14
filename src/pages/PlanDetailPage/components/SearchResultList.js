import React, { useMemo, useState } from "react";
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

export default function SearchResultList({
  results,
  onSelect,
  colorOptions = [],
  onRequestSave,
  savingId,
}) {
  const [pickerFor, setPickerFor] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customColor, setCustomColor] = useState("#93D3E7");
  const [nickInput, setNickInput] = useState("");
  const [descInput, setDescInput] = useState("");

  const validCustom = useMemo(
    () => /^#[0-9A-Fa-f]{6}$/.test((customColor || "").trim()),
    [customColor]
  );

  const openPicker = (place) => {
    const id = place.placeId ?? place.id;
    setPickerFor(id);
    setUseCustom(false);
    setSelectedColor(colorOptions?.[0] ?? "#93D3E7");
    setCustomColor("#93D3E7");
    setNickInput("");
    setDescInput("");
  };

  const closePicker = () => {
    setPickerFor(null);
  };

  const doSave = (place) => {
    const color = useCustom ? (validCustom ? customColor.trim() : null) : selectedColor;
    if (!color) return;
    onRequestSave?.(place, color, nickInput.trim() || undefined, descInput.trim() || undefined);
  };

  return (
    <div className={styles.list}>
      {Array.isArray(results) && results.length > 0 ? (
        results.map((place, idx) => {
          const id = place.placeId ?? place.id ?? idx;
          const open = pickerFor === id;
          const isSaving = savingId && (savingId === (place.placeId ?? place.id));
          return (
            <div key={`${id}`} className={styles.item} onClick={() => onSelect(place)}>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>
                  {place.title ?? place.nickname ?? "이름 없음"}
                </h3>
                <div className={styles.itemHeaderRight} onClick={(e) => e.stopPropagation()}>
                  {place.mapUrl && (
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.naverLink}
                    >
                      네이버 지도로 이동
                    </a>
                  )}
                  <button
                    className={styles.starBtn}
                    aria-label="저장"
                    onClick={() => openPicker(place)}
                  >
                    ☆
                  </button>
                </div>
              </div>

              {open && (
                <div className={styles.savePanel} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.savePanelTitle}>핀 색상 선택</div>
                  <div className={styles.colorChips}>
                    {colorOptions.map((c) => {
                      const active = !useCustom && selectedColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.colorChip} ${active ? styles.colorChipActive : ""}`}
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            setUseCustom(false);
                            setSelectedColor(c);
                          }}
                        />
                      );
                    })}
                    <div className={styles.otherColorRow}>
                      <label className={styles.otherLabel}>
                        <input
                          type="checkbox"
                          checked={useCustom}
                          onChange={(e) => setUseCustom(e.target.checked)}
                        />
                        기타
                      </label>
                      <input
                        type="color"
                        className={styles.legendColorPicker}
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        disabled={!useCustom}
                      />
                      <input
                        type="text"
                        className={styles.legendColorInput}
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        maxLength={7}
                        disabled={!useCustom}
                      />
                    </div>
                  </div>

                  <div className={styles.editRow} style={{ marginTop: 10 }}>
                    <label className={styles.rowLabel}>별칭</label>
                    <input
                      type="text"
                      className={styles.rowValueInput}
                      placeholder="별칭 (선택, 2~30자)"
                      value={nickInput}
                      onChange={(e) => setNickInput(e.target.value)}
                      maxLength={30}
                    />
                  </div>

                  <div className={styles.editRow}>
                    <label className={styles.rowLabel}>메모</label>
                    <textarea
                      rows={3}
                      className={styles.descTextarea}
                      placeholder="설명 (선택, 2~255자)"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <div className={styles.savePanelBtns}>
                    <button type="button" className={styles.legendCancelBtn} onClick={closePicker}>
                      취소
                    </button>
                    <button
                      type="button"
                      className={styles.legendSaveBtn}
                      onClick={() => doSave(place)}
                      disabled={isSaving || (useCustom && !validCustom)}
                    >
                      {isSaving ? "저장 중…" : "저장"}
                    </button>
                  </div>
                </div>
              )}

              {place.address && (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>주소</span>
                  <span className={styles.rowValue}>{place.address}</span>
                </div>
              )}
              {place.roadAddress && (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>도로명 주소</span>
                  <span className={styles.rowValue}>{place.roadAddress}</span>
                </div>
              )}

              {Array.isArray(place.hours ?? place.holiday) &&
                (place.hours ?? place.holiday).length > 0 && (
                  <div className={styles.hoursBlock}>
                    <div className={styles.rowLabel}>영업 시간</div>
                    <div className={styles.hoursList}>
                      {(place.hours ?? place.holiday).map((line, i) => {
                        if (line === "정보 없음")
                          return <div key={i} className={styles.hourLine}>정보 없음</div>;
                        const [d, t = ""] = String(line).split(": ");
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
            </div>
          );
        })
      ) : (
        <div className={styles.empty}>검색 결과가 없습니다.</div>
      )}
    </div>
  );
}
