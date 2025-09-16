import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import styles from "../PlanDetailPage.module.css";
import CustomButton from "../../../components/CustomButton/CustomButton";
import {
  getPlanPlaces,
  parseApiError,
  saveRoutePlace,
} from "../../../services/api";

export default function RouteDetail({
  route,
  places,
  allPlaces,
  loading,
  date,
  onChangeDate,
  onBack,
  onEdit,
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

  const routeTitle =
    route?.name ||
    route?.routeName ||
    route?.title ||
    `루트 ${route?.routeId ?? ""}`;

  const isoDate = date ? date.replace(/\./g, "-") : "";

  const firstItemRef = useRef(null);
  const [maxListHeight, setMaxListHeight] = useState("");

  const [addMode, setAddMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [planPlaces, setPlanPlaces] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [addDate, setAddDate] = useState(isoDate);
  const [nickname, setNickname] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = firstItemRef.current?.getBoundingClientRect?.().height;
    const itemH = Number.isFinite(h) && h > 0 ? h : 68;
    setMaxListHeight(`${itemH * 5}px`);
  }, [places]);

  useEffect(() => {
    setAddDate(isoDate);
  }, [isoDate]);

  const handleBack = useCallback(() => {
    if (addMode && selectMode) {
      setSelectMode(false);
      return;
    }
    if (addMode && !selectMode) {
      setAddMode(false);
      return;
    }
    onBack?.();
  }, [addMode, selectMode, onBack]);

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

  const handleSave = useCallback(async () => {
    if (!route?.routeId && !route?.id) return alert("루트 정보가 없습니다.");
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
        route.routeId || route.id,
        {
          pinPlaceId: selectedPlace.id,
          description: desc || null,
          nickname: nick || null,
          date: addDate,
        },
        token
      );
      alert("루트에 장소가 추가되었습니다.");
      setAddMode(false);
      setSelectMode(false);
      setSelectedPlace(null);
      setNickname("");
      setMemo("");
      typeof onRefresh === "function" && onRefresh();
    } catch (e) {
      const { message } = parseApiError(e);
      alert(message ?? "추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [route, selectedPlace, addDate, nickname, memo, onRefresh]);

  return (
    <div className={styles.routeWrap}>
      <div className={styles.routeHeaderTop}>
        <button
          className={styles.detailBackBtn}
          onClick={handleBack}
          aria-label="뒤로"
        >
          ‹
        </button>
      </div>

      <div className={styles.routeHeaderMain}>
        <h3 className={styles.routeDetailTitle}>{routeTitle}</h3>
        {!addMode && (
          <CustomButton
            text="루트 수정"
            onClick={onEdit}
            width="92px"
            height="34px"
            fontSize="13px"
            fontWeight="700"
            borderRadius="8px"
          />
        )}
      </div>

      {!addMode && (
        <div className={styles.routeDetailDateRow}>
          <div className={styles.routeDateControls}>
            <select
              className={styles.routeDateSelect}
              value={date || ""}
              onChange={(e) => onChangeDate(e.target.value)}
            >
              <option value="">전체</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <input
              type="date"
              className={styles.routeDatePicker}
              value={isoDate}
              onChange={(e) => {
                const v = e.target.value;
                onChangeDate(v ? v.replace(/-/g, ".") : "");
              }}
            />
          </div>
        </div>
      )}

      {!addMode && (
        <div className={styles.routeDetailDateRow}>
          <CustomButton
            text="장소 추가"
            onClick={() => {
              setAddMode(true);
              setSelectMode(false);
              setSelectedPlace(null);
              setNickname("");
              setMemo("");
              setAddDate(isoDate);
            }}
            width="100%"
            height="40px"
            fontSize="14px"
            fontWeight="700"
            borderRadius="8px"
          />
        </div>
      )}

      {addMode && !selectMode && (
        <div className={styles.addFormWrap}>
          <div className={styles.addField}>
            <div className={styles.addLabel}>추가 할 장소</div>
            <CustomButton
              text={selectedPlace ? selectedPlace.title : "장소 선택하기"}
              onClick={openSelectPlaces}
              width="100%"
              height="40px"
              fontSize="14px"
              fontWeight="700"
              borderRadius="8px"
              backgroundColor="var(--secondary-color)"
              textColor="var(--quinary-color)"
            />
          </div>

          <div className={styles.addField}>
            <div className={styles.addLabel}>방문 할 날짜</div>
            <input
              type="date"
              className={styles.routeDatePicker}
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
            />
          </div>

          <div className={styles.addField}>
            <div className={styles.addLabel}>장소 별명</div>
            <div className={styles.inputWrapper}>
              <input
                className={`${styles.rowValueInput} ${styles.inputField}`}
                value={nickname}
                maxLength={20}
                placeholder="(선택) 장소 별명을 입력해 주세요"
                onChange={(e) => setNickname(e.target.value)}
              />
              <span
                className={styles.charCount}
              >{`${nickname.length}/20`}</span>
            </div>
          </div>

          <div className={styles.addField}>
            <div className={styles.addLabel}>장소 메모</div>
            <div className={styles.inputWrapper}>
              <input
                className={`${styles.rowValueInput} ${styles.inputField}`}
                value={memo}
                maxLength={50}
                placeholder="(선택) 장소 메모를 입력해 주세요"
                onChange={(e) => setMemo(e.target.value)}
              />
              <span className={styles.charCount}>{`${memo.length}/50`}</span>
            </div>
          </div>

          <CustomButton
            text={saving ? "저장 중..." : "루트에 장소 추가"}
            onClick={saving ? undefined : handleSave}
            width="100%"
            height="40px"
            fontSize="14px"
            fontWeight="700"
            borderRadius="8px"
            backgroundColor="var(--primary-color)"
          />
        </div>
      )}

      {addMode && selectMode && (
        <div className={styles.selectListWrap}>
          <div className={styles.selectHint}>
            선택하고 싶은 장소가 없으면 먼저 장소를 저장해 주세요!
          </div>
          {selectLoading ? (
            <div className={styles.empty}>불러오는 중…</div>
          ) : planPlaces.length ? (
            <ul className={styles.planPlaceList}>
              {planPlaces.map((pp) => (
                <li key={pp.id} className={styles.planPlaceItem}>
                  <div className={styles.planPlaceInfo}>
                    <div className={styles.planPlaceTitleRow}>
                      <span className={styles.planPlaceTitle}>
                        {pp.title || "(제목 없음)"}
                      </span>
                      {pp.nickname ? (
                        <span className={styles.planPlaceNick}>
                          {pp.nickname}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.planPlaceAddr}>
                      {pp.address || ""}
                    </div>
                    <div className={styles.planPlaceAddr}>
                      {pp.roadAddress || ""}
                    </div>
                    {pp.link ? (
                      <a
                        className={styles.naverLink}
                        href={pp.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        네이버 지도로 이동
                      </a>
                    ) : null}
                  </div>
                  <CustomButton
                    text="선택"
                    onClick={() => {
                      setSelectedPlace(pp);
                      setSelectMode(false);
                    }}
                    width="64px"
                    height="32px"
                    fontSize="13px"
                    fontWeight="700"
                    borderRadius="8px"
                    backgroundColor="var(--primary-color)"
                    textColor="var(--text-secondary)"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>저장된 장소가 없습니다.</div>
          )}
        </div>
      )}

      {!addMode && (
        <>
          {loading ? (
            <div className={styles.empty}>불러오는 중…</div>
          ) : places?.length ? (
            <ul
              className={styles.routeList}
              style={{
                maxHeight: places.length > 5 ? maxListHeight : "none",
                overflowY: places.length > 5 ? "auto" : "visible",
              }}
            >
              {places.map((p, idx) => (
                <li
                  key={p.routePlaceId ?? `${p.lat}-${p.lng}-${p.sequence}`}
                  className={`${styles.routeItem} ${styles.routeItemRow}`}
                  ref={idx === 0 ? firstItemRef : null}
                  onClick={() => onOpenPlace?.(p.pinPlaceId)}
                >
                  <div
                    className={styles.routeSeq}
                    style={{ color: "var(--primary-color)" }}
                  >
                    {p.sequence ?? ""}
                  </div>
                  <div className={styles.routeCenter}>
                    <div className={styles.routeTitleRow}>
                      <span className={styles.routeTitleTxt}>
                        {p.title || "(삭제됨)"}
                      </span>
                      {p.nickname ? (
                        <span className={styles.routeNickTxt}>
                          {p.nickname}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.routeAddr}>{p.address || ""}</div>
                    <div className={styles.routeAddr}>
                      {p.roadAddress || ""}
                    </div>
                  </div>
                  <div className={styles.routeRight}>
                    <span className={styles.routeDescTxt}>
                      {p.description || ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.routeEmpty}>
              선택된 날짜의 장소가 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}
