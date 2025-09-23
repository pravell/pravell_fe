import React from "react";
import styles from "../PlanDetailPage.module.css";

export default function RouteList({ routes = [], onAdd, onSelect }) {
  return (
    <div className={styles.routeWrap}>
      <ul className={styles.routeList}>
        {routes.map((r) => (
          <li
            key={r.routeId || r.id}
            className={styles.routeItem}
            onClick={() => onSelect?.(r)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" ? onSelect?.(r) : null)}
          >
            <div className={styles.routeName}>{r.name}</div>
            <div className={styles.routeMeta}>
              {r.description || "설명 없음"}
            </div>
          </li>
        ))}
        {routes.length === 0 && (
          <li className={styles.routeEmpty}>등록된 루트가 없습니다.</li>
        )}
      </ul>

      <button type="button" className={styles.addRouteBtn} onClick={onAdd}>
        + 루트 추가
      </button>
    </div>
  );
}
