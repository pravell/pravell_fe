import React, { useRef, useState, useCallback } from "react";
import CustomButton from "../../../../components/CustomButton/CustomButton";

export default function RoutePlaces({
  styles,
  places,
  loading,
  maxListHeight,
  firstItemRef,
  manageMode,
  selectedPlaceIds,
  toggleSelectPlace,
  onOpenPlace,
  editPlaceId,
  openEditPlace,
  cancelEditPlace,
  editNick,
  editDesc,
  editDate,
  setEditNick,
  setEditDesc,
  setEditDate,
  placeSaving,
  onSaveEdit,
  setPlaces,
  onUpdateSequence,
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const [draggingIdx, setDraggingIdx] = useState(null);
  const touchDragActive = useRef(false);

  const commitSort = useCallback(() => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    ) {
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggingIdx(null);
      return;
    }
    const next = [...places];
    const dragged = next.splice(dragItem.current, 1)[0];
    next.splice(dragOverItem.current, 0, dragged);

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null);

    setPlaces(next);
    onUpdateSequence(next);
  }, [places, setPlaces, onUpdateSequence]);

  const cleanupTouch = () => {
    touchDragActive.current = false;
    window.removeEventListener("touchmove", onTouchMove, { capture: true });
    window.removeEventListener("touchend", onTouchEnd, { capture: true });
  };

  const onTouchMove = (e) => {
    if (!touchDragActive.current) return;
    e.preventDefault();
    const t = e.touches?.[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const li = el?.closest?.("li[data-idx]");
    if (li) {
      const idx = Number(li.dataset.idx);
      if (!Number.isNaN(idx)) dragOverItem.current = idx;
    }
  };

  const onTouchEnd = () => {
    commitSort();
    cleanupTouch();
  };

  const startTouchDragFromHandle = (idx) => {
    if (!manageMode) return;
    dragItem.current = idx;
    dragOverItem.current = idx;
    setDraggingIdx(idx);
    touchDragActive.current = true;

    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchend", onTouchEnd, { capture: true });
  };

  const handleDragStart = (_, index) => {
    dragItem.current = index;
    dragOverItem.current = index;
    setDraggingIdx(index);
  };
  const handleDragEnter = (_, index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    commitSort();
  };

  if (loading) return <div className={styles.empty}>불러오는 중…</div>;
  if (!places?.length)
    return <div className={styles.routeEmpty}>선택된 날짜의 장소가 없습니다.</div>;

  return (
    <ul
      className={styles.routeList}
      style={{
        maxHeight: places.length > 5 ? maxListHeight : "none",
        overflowY: places.length > 5 ? "auto" : "visible",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {places.map((p, idx) => {
        const checked = selectedPlaceIds.has(p.routePlaceId);
        const isEditing = editPlaceId === p.routePlaceId;
        const isDragging = draggingIdx === idx;

        return (
          <li
            key={p.routePlaceId ?? `${p.lat}-${p.lng}-${p.sequence}`}
            data-idx={idx}
            className={[
              styles.routeItem,
              styles.routeItemRow,
              isDragging ? styles.routeItemActive : "",
              isDragging ? styles.routeItemDragging : "",
              manageMode && isEditing ? styles.routeItemEditing : "",
            ].join(" ")}
            ref={idx === 0 ? firstItemRef : null}
            onClick={manageMode ? undefined : () => onOpenPlace?.(p.pinPlaceId)}
            draggable={manageMode}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            style={{ touchAction: "pan-y" }}
          >
            <div className={styles.routeLeft}>
              {manageMode ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelectPlace(p.routePlaceId)}
                    style={{ marginBottom: 4 }}
                  />
                  <div
                    className={styles.dragHandle}
                    onTouchStart={() => startTouchDragFromHandle(idx)}
                    onMouseDown={() => setDraggingIdx(idx)}
                    role="button"
                    aria-label="순서 변경"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                    >
                      <path d="M4 6H20" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 12H20" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                      <path d="M4 18H20" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className={styles.routeSeq} style={{ color: "var(--primary-color)" }}>
                  {idx + 1 ?? ""}
                </div>
              )}
            </div>

            <div className={styles.routeCenter}>
              <div className={styles.routeTitleRow}>
                <span className={styles.routeTitleTxt}>{p.title || "(삭제됨)"}</span>
                {p.nickname ? <span className={styles.routeNickTxt}>{p.nickname}</span> : null}
              </div>
              <div className={styles.routeAddr}>{p.address || ""}</div>
              <div className={styles.routeAddr}>{p.roadAddress || ""}</div>
              {/* ✅ p.description이 있을 때만 span 태그를 렌더링합니다. */}
              {!manageMode && p.description && <span className={styles.routeDescTxt}>{p.description}</span>}
              

              {manageMode && isEditing && (
                <div style={{ marginTop: 8 }}>
                  <div className={styles.addField}>
                    <div className={styles.addLabel}>별명</div>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.rowValueInput} ${styles.inputField}`}
                        value={editNick}
                        maxLength={20}
                        onChange={(e) => setEditNick(e.target.value)}
                        placeholder="(선택) 2~20자"
                      />
                      <span className={styles.charCount}>{`${editNick.length}/20`}</span>
                    </div>
                  </div>

                  <div className={styles.addField}>
                    <div className={styles.addLabel}>메모</div>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.rowValueInput} ${styles.inputField}`}
                        value={editDesc}
                        maxLength={50}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="(선택) 2~50자"
                      />
                      <span className={styles.charCount}>{`${editDesc.length}/50`}</span>
                    </div>
                  </div>

                  <div className={styles.addField}>
                    <div className={styles.addLabel}>날짜</div>
                    <input
                      type="date"
                      className={styles.rowValueInput}
                      value={editDate || ""}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <CustomButton
                      text={placeSaving ? "저장 중..." : "저장"}
                      onClick={placeSaving ? undefined : onSaveEdit}
                      width="110px"
                      height="34px"
                      fontSize="13px"
                      fontWeight="700"
                      borderRadius="8px"
                      backgroundColor="var(--primary-color)"
                    />
                    <CustomButton
                      text="취소"
                      onClick={cancelEditPlace}
                      width="80px"
                      height="34px"
                      fontSize="13px"
                      fontWeight="700"
                      borderRadius="8px"
                      backgroundColor="#eee"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.routeRight}>
              {manageMode && (
                <CustomButton
                  text={isEditing ? "수정 중" : "수정"}
                  onClick={isEditing ? undefined : () => openEditPlace(p)}
                  width="64px"
                  height="28px"
                  fontSize="12px"
                  fontWeight="700"
                  borderRadius="8px"
                  backgroundColor="#3e66d3"
                  textColor="#fff"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
