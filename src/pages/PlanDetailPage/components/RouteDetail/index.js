import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
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
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
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
    if (nick && (nick.length < 2 || nick.length > 20)) return alert("장소 별명은 2~20자여야 합니다.");
    if (desc && (desc.length < 2 || desc.length > 50)) return alert("장소 메모는 2~50자여야 합니다.");

    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setSaving(true);
      await saveRoutePlace(routeId, {
        pinPlaceId: selectedPlace.id,
        description: desc || null,
        nickname: nick || null,
        date: addDate,
      }, token);
      setAddMode(false);
      setSelectMode(false);
      setSelectedPlace(null);
      setNickname("");
      setMemo("");
      onRefresh?.();
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
      onRefresh?.();
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "루트 수정에 실패했습니다.");
    } finally {
      setRouteSaving(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!planId || !routeId) return alert("필요한 정보가 없습니다.");
    if (!window.confirm("이 루트를 삭제할까요? 되돌릴 수 없습니다.")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setRouteDeleting(true);
      await deleteRoutes(planId, [routeId], token);
      onBack?.();
      onRefresh?.();
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

  const handleDeletePlaces = async () => {
    if (!routeId) return alert("루트 정보가 없습니다.");
    if (!selectedPlaceIds.size) return alert("삭제할 장소를 선택하세요.");
    if (!window.confirm("선택한 장소를 삭제할까요?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setDeleteLoading(true);
      await deleteRoutePlaces(routeId, Array.from(selectedPlaceIds), token);
      setSelectedPlaceIds(new Set());
      setManageMode(false);
      onRefresh?.();
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

    if (nick && (nick.length < 2 || nick.length > 20)) return alert("별명은 2~20자여야 합니다.");
    if (desc && (desc.length < 2 || desc.length > 50)) return alert("메모는 2~50자여야 합니다.");
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
      onRefresh?.();
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "장소 수정에 실패했습니다.");
    } finally {
      setPlaceSaving(false);
    }
  };

  return (
    <div className={styles.routeWrap}>
      <HeaderBar
        styles={styles}
        onBack={handleBack}
        routeTitle={routeTitle}
        addMode={addMode}
        routeEditMode={routeEditMode}
        onClickRouteEdit={onClickRouteEdit}
        onDeleteRoute={handleDeleteRoute}
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
                onDeleteSelected={handleDeletePlaces}
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
            />
          )}
        </>
      )}
    </div>
  );
}
