import React, { useMemo, useRef, useEffect, useState } from "react";
import styles from "../PlanDetailPage.module.css";
import CustomButton from "../../../components/CustomButton/CustomButton";

export default function RouteDetail({
  route,
  places,
  allPlaces,
  loading,
  date,
  onChangeDate,
  onBack,
  onEdit,
  onAddPlace,
  onOpenPlace,
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

  useEffect(() => {
    const h = firstItemRef.current?.getBoundingClientRect?.().height;
    const itemH = Number.isFinite(h) && h > 0 ? h : 68;
    setMaxListHeight(`${itemH * 5}px`);
  }, [places]);

  return (
    <div className={styles.routeWrap}>
      <div className={styles.routeHeaderTop}>
        <button
          className={styles.detailBackBtn}
          onClick={onBack}
          aria-label="뒤로"
        >
          ‹
        </button>
      </div>

      <div className={styles.routeHeaderMain}>
        <h3 className={styles.routeDetailTitle}>{routeTitle}</h3>
        <button className={styles.textBtn} onClick={onEdit}>
          루트 수정
        </button>
      </div>

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

      <div className={styles.routeDetailDateRow}>
        <CustomButton
          text="장소 추가"
          onClick={onAddPlace}
          width="100%"
          height="40px"
          fontSize="14px"
          fontWeight="700"
          borderRadius="8px"
        />
      </div>

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
                    <span className={styles.routeNickTxt}>{p.nickname}</span>
                  ) : null}
                </div>
                <div className={styles.routeAddr}>{p.address || ""}</div>
                <div className={styles.routeAddr}>{p.roadAddress || ""}</div>
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
        <div className={styles.routeEmpty}>선택된 날짜의 장소가 없습니다.</div>
      )}
    </div>
  );
}
