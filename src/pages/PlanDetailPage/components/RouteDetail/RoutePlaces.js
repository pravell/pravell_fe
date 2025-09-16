import React from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function RoutePlaces({
  styles, places, loading, maxListHeight, firstItemRef,
  manageMode, selectedPlaceIds, toggleSelectPlace, onOpenPlace,
  editPlaceId, openEditPlace, cancelEditPlace,
  editNick, editDesc, editSeq, setEditNick, setEditDesc, setEditSeq,
  placeSaving, onSaveEdit,
}) {
  if (loading) return <div className={styles.empty}>불러오는 중…</div>;
  if (!places?.length) return <div className={styles.routeEmpty}>선택된 날짜의 장소가 없습니다.</div>;

  return (
    <ul className={styles.routeList}
      style={{ maxHeight: places.length > 5 ? maxListHeight : "none", overflowY: places.length > 5 ? "auto" : "visible" }}>
      {places.map((p, idx) => {
        const checked = selectedPlaceIds.has(p.routePlaceId);
        const isEditing = editPlaceId === p.routePlaceId;

        return (
          <li key={p.routePlaceId ?? `${p.lat}-${p.lng}-${p.sequence}`}
              className={`${styles.routeItem} ${styles.routeItemRow}`}
              ref={idx === 0 ? firstItemRef : null}
              onClick={manageMode ? undefined : () => onOpenPlace?.(p.pinPlaceId)}>
            {manageMode ? (
              <input type="checkbox" checked={checked} onChange={() => toggleSelectPlace(p.routePlaceId)} style={{ marginTop: 3 }} />
            ) : (
              <div className={styles.routeSeq} style={{ color: "var(--primary-color)" }}>{p.sequence ?? ""}</div>
            )}

            <div className={styles.routeCenter}>
              <div className={styles.routeTitleRow}>
                <span className={styles.routeTitleTxt}>{p.title || "(삭제됨)"}</span>
                {p.nickname ? <span className={styles.routeNickTxt}>{p.nickname}</span> : null}
              </div>
              <div className={styles.routeAddr}>{p.address || ""}</div>
              <div className={styles.routeAddr}>{p.roadAddress || ""}</div>

              {manageMode && isEditing && (
                <div style={{ marginTop: 8 }}>
                  <div className={styles.addField}>
                    <div className={styles.addLabel}>별명</div>
                    <div className={styles.inputWrapper}>
                      <input className={`${styles.rowValueInput} ${styles.inputField}`}
                        value={editNick} maxLength={20}
                        onChange={(e) => setEditNick(e.target.value)} placeholder="(선택) 2~20자" />
                      <span className={styles.charCount}>{`${editNick.length}/20`}</span>
                    </div>
                  </div>
                  <div className={styles.addField}>
                    <div className={styles.addLabel}>메모</div>
                    <div className={styles.inputWrapper}>
                      <input className={`${styles.rowValueInput} ${styles.inputField}`}
                        value={editDesc} maxLength={50}
                        onChange={(e) => setEditDesc(e.target.value)} placeholder="(선택) 2~50자" />
                      <span className={styles.charCount}>{`${editDesc.length}/50`}</span>
                    </div>
                  </div>
                  <div className={styles.addField}>
                    <div className={styles.addLabel}>순서</div>
                    <input className={styles.rowValueInput} value={editSeq} onChange={(e) => setEditSeq(e.target.value)} placeholder="숫자" />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <CustomButton text={placeSaving ? "저장 중..." : "저장"}
                      onClick={placeSaving ? undefined : onSaveEdit}
                      width="110px" height="34px" fontSize="13px" fontWeight="700" borderRadius="8px"
                      backgroundColor="var(--primary-color)" />
                    <CustomButton text="취소" onClick={cancelEditPlace}
                      width="80px" height="34px" fontSize="13px" fontWeight="700" borderRadius="8px" backgroundColor="#eee" />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.routeRight}>
              {!manageMode ? (
                <span className={styles.routeDescTxt}>{p.description || ""}</span>
              ) : (
                <CustomButton text={isEditing ? "수정 중" : "수정"}
                  onClick={isEditing ? undefined : () => openEditPlace(p)}
                  width="64px" height="28px" fontSize="12px" fontWeight="700" borderRadius="8px"
                  backgroundColor="#3e66d3" textColor="#fff" />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
