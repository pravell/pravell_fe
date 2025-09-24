// import React, { useRef } from "react";
// import CustomButton from "../../../../components/CustomButton/CustomButton";

// export default function RoutePlaces({
//   styles,
//   places,
//   loading,
//   maxListHeight,
//   firstItemRef,
//   manageMode,
//   selectedPlaceIds,
//   toggleSelectPlace,
//   onOpenPlace,
//   editPlaceId,
//   openEditPlace,
//   cancelEditPlace,
//   editNick,
//   editDesc,
//   editSeq,
//   setEditNick,
//   setEditDesc,
//   setEditSeq,
//   placeSaving,
//   onSaveEdit,
//   setPlaces,
//   routeId,
//   onUpdateSequence,
// }) {
//   const dragItem = useRef(null);
//   const dragOverItem = useRef(null);

//   const handleDragStart = (e, index) => {
//     dragItem.current = index;
//   };

//   const handleDragEnter = (e, index) => {
//     dragOverItem.current = index;
//   };

//   const handleTouchStart = (e, index) => {
//     dragItem.current = index;
//   };

//   const handleTouchMove = (e, index) => {
//     dragOverItem.current = index;
//   };

//   const handleSort = () => {
//     if (
//       dragItem.current === null ||
//       dragOverItem.current === null ||
//       dragItem.current === dragOverItem.current
//     )
//       return;

//     let _places = [...places];
//     const draggedItem = _places.splice(dragItem.current, 1)[0];
//     _places.splice(dragOverItem.current, 0, draggedItem);
//     dragItem.current = null;
//     dragOverItem.current = null;

//     _places = _places.map((p, index) => ({
//       ...p,
//       sequence: index,
//     }));
//     setPlaces(_places);
//     onUpdateSequence(_places);
//   };

//   if (loading) return <div className={styles.empty}>불러오는 중…</div>;
//   if (!places?.length)
//     return (
//       <div className={styles.routeEmpty}>선택된 날짜의 장소가 없습니다.</div>
//     );

//   return (
//     <ul
//       className={styles.routeList}
//       style={{
//         maxHeight: places.length > 5 ? maxListHeight : "none",
//         overflowY: places.length > 5 ? "auto" : "visible",
//       }}
//     >
//       {places.map((p, idx) => {
//         const checked = selectedPlaceIds.has(p.routePlaceId);
//         const isEditing = editPlaceId === p.routePlaceId;

//         return (
//           <li
//             key={p.routePlaceId ?? `${p.lat}-${p.lng}-${p.sequence}`}
//             className={`${styles.routeItem} ${styles.routeItemRow}`}
//             ref={idx === 0 ? firstItemRef : null}
//             onClick={manageMode ? undefined : () => onOpenPlace?.(p.pinPlaceId)}
//             draggable={manageMode}
//             onDragStart={(e) => handleDragStart(e, idx)}
//             onDragEnter={(e) => handleDragEnter(e, idx)}
//             onDragEnd={handleSort}
//             onTouchStart={(e) => handleTouchStart(e, idx)}
//             onTouchMove={(e) => handleTouchMove(e, idx)}
//             onTouchEnd={handleSort}
//             onDragOver={(e) => e.preventDefault()}
//           >
//             <div className={styles.routeLeft}>
//               {manageMode ? (
//                 <>
//                   <input
//                     type="checkbox"
//                     checked={checked}
//                     onChange={() => toggleSelectPlace(p.routePlaceId)}
//                     style={{ marginTop: 3 }}
//                   />
//                   <div className={styles.dragHandle}>
//                     <svg
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="24"
//                       height="24"
//                     >
//                       <path
//                         d="M4 6H20"
//                         stroke="#000"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                       <path
//                         d="M4 12H20"
//                         stroke="#000"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                       <path
//                         d="M4 18H20"
//                         stroke="#000"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                     </svg>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   className={styles.routeSeq}
//                   style={{ color: "var(--primary-color)" }}
//                 >
//                   {idx + 1 ?? ""}
//                 </div>
//               )}
//             </div>

//             <div className={styles.routeCenter}>
//               <div className={styles.routeTitleRow}>
//                 <span className={styles.routeTitleTxt}>
//                   {p.title || "(삭제됨)"}
//                 </span>
//                 {p.nickname ? (
//                   <span className={styles.routeNickTxt}>{p.nickname}</span>
//                 ) : null}
//               </div>
//               <div className={styles.routeAddr}>{p.address || ""}</div>
//               <div className={styles.routeAddr}>{p.roadAddress || ""}</div>

//               {manageMode && isEditing && (
//                 <div style={{ marginTop: 8 }}>
//                   <div className={styles.addField}>
//                     <div className={styles.addLabel}>별명</div>
//                     <div className={styles.inputWrapper}>
//                       <input
//                         className={`${styles.rowValueInput} ${styles.inputField}`}
//                         value={editNick}
//                         maxLength={20}
//                         onChange={(e) => setEditNick(e.target.value)}
//                         placeholder="(선택) 2~20자"
//                       />
//                       <span
//                         className={styles.charCount}
//                       >{`${editNick.length}/20`}</span>
//                     </div>
//                   </div>
//                   <div className={styles.addField}>
//                     <div className={styles.addLabel}>메모</div>
//                     <div className={styles.inputWrapper}>
//                       <input
//                         className={`${styles.rowValueInput} ${styles.inputField}`}
//                         value={editDesc}
//                         maxLength={50}
//                         onChange={(e) => setEditDesc(e.target.value)}
//                         placeholder="(선택) 2~50자"
//                       />
//                       <span
//                         className={styles.charCount}
//                       >{`${editDesc.length}/50`}</span>
//                     </div>
//                   </div>
//                   <div style={{ display: "flex", gap: 8 }}>
//                     <CustomButton
//                       text={placeSaving ? "저장 중..." : "저장"}
//                       onClick={placeSaving ? undefined : onSaveEdit}
//                       width="110px"
//                       height="34px"
//                       fontSize="13px"
//                       fontWeight="700"
//                       borderRadius="8px"
//                       backgroundColor="var(--primary-color)"
//                     />
//                     <CustomButton
//                       text="취소"
//                       onClick={cancelEditPlace}
//                       width="80px"
//                       height="34px"
//                       fontSize="13px"
//                       fontWeight="700"
//                       borderRadius="8px"
//                       backgroundColor="#eee"
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className={styles.routeRight}>
//               {!manageMode ? (
//                 <span className={styles.routeDescTxt}>
//                   {p.description || ""}
//                 </span>
//               ) : (
//                 <CustomButton
//                   text={isEditing ? "수정 중" : "수정"}
//                   onClick={isEditing ? undefined : () => openEditPlace(p)}
//                   width="64px"
//                   height="28px"
//                   fontSize="12px"
//                   fontWeight="700"
//                   borderRadius="8px"
//                   backgroundColor="#3e66d3"
//                   textColor="#fff"
//                 />
//               )}
//             </div>
//           </li>
//         );
//       })}
//     </ul>
//   );
// }

import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import styles from "../../PlanDetailPage.module.css";
import {
  getPlanPlaces,
  parseApiError,
  saveRoutePlace,
  patchRoute,
  deleteRoutes,
  deleteRoutePlaces,
  patchRoutePlace,
} from "../../../../services/api";

import HeaderBar from "./HeaderBar";
import DateFilters from "./DateFilters";
import ManageToolbar from "./ManageToolbar";
import AddPlaceForm from "./AddPlaceForm";
import SelectPlaceList from "./SelectPlaceList";
import EditRouteForm from "./EditRouteForm";
import RoutePlaces from "./RoutePlaces";
import ConfirmationModal from "../../../../components/ConfirmationModal/ConfirmationModal";

export default function RouteDetail({
  route,
  places,
  allPlaces,
  loading,
  date,
  onChangeDate,
  onBack,
  onOpenPlace,
  planId,
  onRefresh,
  setRoutePlaces,
}) {
  const dateOptions = useMemo(() => {
    const set = new Set(
      (allPlaces || [])
        .map((p) => (p?.date || "").replace(/-/g, "."))
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allPlaces]);

  const routeId = route?.routeId || route?.id;
  const routeTitle =
    route?.name || route?.routeName || route?.title || `루트 ${routeId ?? ""}`;
  const isoDate = date ? date.replace(/\./g, "-") : "";

  const firstItemRef = useRef(null);
  const [maxListHeight, setMaxListHeight] = useState("");
  useEffect(() => {
    const h = firstItemRef.current?.getBoundingClientRect?.().height;
    const itemH = Number.isFinite(h) && h > 0 ? h : 68;
    setMaxListHeight(`${itemH * 5}px`);
  }, [places]);
  useEffect(() => setAddDate(isoDate), [isoDate]);

  const [addMode, setAddMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [planPlaces, setPlanPlaces] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [addDate, setAddDate] = useState(isoDate);
  const [nickname, setNickname] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const [routeEditMode, setRouteEditMode] = useState(false);
  const [routeName, setRouteName] = useState(route?.name || "");
  const [routeDesc, setRouteDesc] = useState(route?.description || "");
  const [routeSaving, setRouteSaving] = useState(false);
  const [routeDeleting, setRouteDeleting] = useState(false);

  const [manageMode, setManageMode] = useState(false);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editPlaceId, setEditPlaceId] = useState(null);
  const [editNick, setEditNick] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSeq, setEditSeq] = useState("");
  const [placeSaving, setPlaceSaving] = useState(false);

  const [confirmRouteDeleteOpen, setConfirmRouteDeleteOpen] = useState(false);
  const [confirmPlacesDeleteOpen, setConfirmPlacesDeleteOpen] = useState(false);

  const handleBack = useCallback(() => {
    if (addMode && selectMode) return setSelectMode(false);
    if (addMode && !selectMode) return setAddMode(false);
    if (routeEditMode) return setRouteEditMode(false);
    if (manageMode) {
      setManageMode(false);
      setSelectedPlaceIds(new Set());
      setEditPlaceId(null);
      return;
    }
    onBack?.();
  }, [addMode, selectMode, routeEditMode, manageMode, onBack]);

  const openSelectPlaces = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");
    try {
      setSelectLoading(true);
      const { data } = await getPlanPlaces(planId, token);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setPlanPlaces(list);
      setSelectMode(true);
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "저장된 장소를 불러오지 못했습니다.");
    } finally {
      setSelectLoading(false);
    }
  }, [planId]);

  const handleSavePlace = useCallback(async () => {
    if (!routeId) return alert("루트 정보가 없습니다.");
    if (!selectedPlace?.id) return alert("추가할 장소를 선택하세요.");
    if (!addDate) return alert("방문 할 날짜를 선택하세요.");

    const nick = nickname.trim();
    const desc = memo.trim();
    if (nick && (nick.length < 2 || nick.length > 20))
      return alert("장소 별명은 2~20자여야 합니다.");
    if (desc && (desc.length < 2 || desc.length > 50))
      return alert("장소 메모는 2~50자여야 합니다.");

    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setSaving(true);
      await saveRoutePlace(
        routeId,
        {
          pinPlaceId: selectedPlace.id,
          description: desc || null,
          nickname: nick || null,
          date: addDate,
        },
        token
      );
      setAddMode(false);
      setSelectMode(false);
      setSelectedPlace(null);
      setNickname("");
      setMemo("");
      onRefresh?.({ reopen: true });
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [routeId, selectedPlace, addDate, nickname, memo, onRefresh]);

  const onClickRouteEdit = () => {
    setRouteName(route?.name || "");
    setRouteDesc(route?.description || "");
    setRouteEditMode(true);
  };

  const handlePatchRoute = async () => {
    if (!routeId) return alert("루트 정보가 없습니다.");
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    const body = {};
    const nameTrim = routeName.trim();
    const descTrim = routeDesc.trim();

    if (nameTrim && (nameTrim.length < 2 || nameTrim.length > 30))
      return alert("이름은 2~30자 사이여야 합니다.");
    if (descTrim && (descTrim.length < 2 || descTrim.length > 50))
      return alert("설명은 2~50자 사이여야 합니다.");

    if (nameTrim !== (route?.name || "")) body.name = nameTrim;
    if (descTrim !== (route?.description || "")) body.description = descTrim;
    if (!Object.keys(body).length) return;

    try {
      setRouteSaving(true);
      await patchRoute(routeId, body, token);
      setRouteEditMode(false);
      onRefresh?.({ reopen: true });
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "루트 수정에 실패했습니다.");
    } finally {
      setRouteSaving(false);
    }
  };

  const doDeleteRoute = async () => {
    if (!planId || !routeId) return alert("필요한 정보가 없습니다.");
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");
    try {
      setRouteDeleting(true);
      await deleteRoutes(planId, [routeId], token);
      onBack?.();
      onRefresh?.({ reopen: false });
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "루트 삭제에 실패했습니다.");
    } finally {
      setRouteDeleting(false);
    }
  };

  const toggleSelectPlace = (id) => {
    const next = new Set(selectedPlaceIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedPlaceIds(next);
  };

  const doDeleteSelectedPlaces = async () => {
    if (!routeId) return alert("루트 정보가 없습니다.");
    if (!selectedPlaceIds.size) return alert("삭제할 장소를 선택하세요.");

    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setDeleteLoading(true);
      await deleteRoutePlaces(routeId, Array.from(selectedPlaceIds), token);
      setSelectedPlaceIds(new Set());
      setManageMode(false);
      onRefresh?.({ reopen: true });
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "장소 삭제에 실패했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditPlace = (p) => {
    setEditPlaceId(p.routePlaceId);
    setEditNick(p.nickname || "");
    setEditDesc(p.description || "");
    setEditSeq(String(p.sequence ?? ""));
  };
  const cancelEditPlace = () => {
    setEditPlaceId(null);
    setEditNick("");
    setEditDesc("");
    setEditSeq("");
  };
  const handlePatchPlace = async () => {
    if (!routeId || !editPlaceId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    const body = {};
    const nick = editNick.trim();
    const desc = editDesc.trim();
    const seq = editSeq.trim();

    if (nick && (nick.length < 2 || nick.length > 20))
      return alert("별명은 2~20자여야 합니다.");
    if (desc && (desc.length < 2 || desc.length > 50))
      return alert("메모는 2~50자여야 합니다.");
    if (seq && !/^\d+$/.test(seq)) return alert("순서는 숫자여야 합니다.");

    if (nick !== "") body.nickname = nick;
    if (desc !== "") body.description = desc;
    if (seq !== "") body.sequence = Number(seq);
    if (!Object.keys(body).length) return alert("변경된 내용이 없습니다.");

    try {
      setPlaceSaving(true);
      await patchRoutePlace(routeId, editPlaceId, body, token);
      alert("장소가 수정되었습니다.");
      cancelEditPlace();
      onRefresh?.({ reopen: true });
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "장소 수정에 실패했습니다.");
    } finally {
      setPlaceSaving(false);
    }
  };

  const handleUpdateSequence = useCallback(
    async (reorderedPlaces) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }
      setRoutePlaces(reorderedPlaces);
      try {
        const updates = reorderedPlaces
          .map((p, index) => {
            if (p.sequence !== index) {
              return patchRoutePlace(
                routeId,
                p.routePlaceId,
                { sequence: index },
                token
              );
            }
            return null;
          })
          .filter(Boolean);

        await Promise.all(updates);
      } catch (e) {
        const { message } = parseApiError(e);
        alert(message ?? "순서 변경에 실패했습니다.");
        onRefresh?.({ reopen: true });
      }
    },
    [routeId, setRoutePlaces, onRefresh]
  );

  return (
    <div className={styles.routeWrap}>
      <HeaderBar
        styles={styles}
        onBack={handleBack}
        routeTitle={routeTitle}
        addMode={addMode}
        routeEditMode={routeEditMode}
        onClickRouteEdit={onClickRouteEdit}
        onDeleteRoute={() => setConfirmRouteDeleteOpen(true)}
        routeDeleting={routeDeleting}
      />

      {routeEditMode ? (
        <EditRouteForm
          styles={styles}
          routeName={routeName}
          routeDesc={routeDesc}
          onChangeName={setRouteName}
          onChangeDesc={setRouteDesc}
          onSave={handlePatchRoute}
          onCancel={() => setRouteEditMode(false)}
          saving={routeSaving}
        />
      ) : (
        <>
          {!addMode && (
            <>
              <DateFilters
                styles={styles}
                dateOptions={dateOptions}
                date={date}
                isoDate={isoDate}
                onChangeDate={onChangeDate}
              />
              <ManageToolbar
                styles={styles}
                addMode={addMode}
                manageMode={manageMode}
                onClickAdd={() => {
                  setAddMode(true);
                  setSelectMode(false);
                  setSelectedPlace(null);
                  setNickname("");
                  setMemo("");
                  setAddDate(isoDate);
                }}
                onToggleManage={() => {
                  setManageMode((v) => !v);
                  setSelectedPlaceIds(new Set());
                  setEditPlaceId(null);
                }}
                onDeleteSelected={() => {
                  if (!selectedPlaceIds.size)
                    return alert("삭제할 장소를 선택하세요.");
                  setConfirmPlacesDeleteOpen(true);
                }}
                deleteLoading={deleteLoading}
              />
            </>
          )}

          {addMode && !selectMode && (
            <AddPlaceForm
              styles={styles}
              selectedPlace={selectedPlace}
              addDate={addDate}
              nickname={nickname}
              memo={memo}
              onOpenSelect={openSelectPlaces}
              onChangeDate={setAddDate}
              onChangeNick={setNickname}
              onChangeMemo={setMemo}
              onSave={handleSavePlace}
              saving={saving}
            />
          )}

          {addMode && selectMode && (
            <SelectPlaceList
              styles={styles}
              selectLoading={selectLoading}
              planPlaces={planPlaces}
              onSelect={(pp) => {
                setSelectedPlace(pp);
                setSelectMode(false);
              }}
            />
          )}

          {!addMode && (
            <RoutePlaces
              styles={styles}
              places={places}
              loading={loading}
              maxListHeight={maxListHeight}
              firstItemRef={firstItemRef}
              manageMode={manageMode}
              selectedPlaceIds={selectedPlaceIds}
              toggleSelectPlace={toggleSelectPlace}
              onOpenPlace={onOpenPlace}
              editPlaceId={editPlaceId}
              openEditPlace={openEditPlace}
              cancelEditPlace={cancelEditPlace}
              editNick={editNick}
              editDesc={editDesc}
              editSeq={editSeq}
              setEditNick={setEditNick}
              setEditDesc={setEditDesc}
              setEditSeq={setEditSeq}
              placeSaving={placeSaving}
              onSaveEdit={handlePatchPlace}
              setPlaces={setRoutePlaces}
              onUpdateSequence={handleUpdateSequence}
            />
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={confirmRouteDeleteOpen}
        onClose={() => setConfirmRouteDeleteOpen(false)}
        onConfirm={async () => {
          if (routeDeleting) return;
          setConfirmRouteDeleteOpen(false);
          await doDeleteRoute();
        }}
        title="루트 삭제"
        description="이 루트를 삭제할까요? 되돌릴 수 없습니다."
        confirmText={routeDeleting ? "삭제 중..." : "삭제"}
        cancelText="취소"
        confirmButtonColor="#bf1041"
        confirmTextColor="#ffffff"
        cancelButtonColor="#000000"
        cancelTextColor="#ffffff"
      />

      <ConfirmationModal
        isOpen={confirmPlacesDeleteOpen}
        onClose={() => setConfirmPlacesDeleteOpen(false)}
        onConfirm={async () => {
          if (deleteLoading) return;
          setConfirmPlacesDeleteOpen(false);
          await doDeleteSelectedPlaces();
        }}
        title="선택한 장소 삭제"
        description="선택한 장소를 삭제할까요?"
        confirmText={deleteLoading ? "삭제 중..." : "삭제"}
        cancelText="취소"
        confirmButtonColor="#ffe3e3"
        confirmTextColor="#b00020"
        cancelButtonColor="#000000"
        cancelTextColor="#ffffff"
      />
    </div>
  );
}
