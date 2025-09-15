import React from "react";
import styles from "../PlanDetailPage.module.css";

export default function RouteList({ routes, onAdd }) {
  return (
    <div className={styles.routeWrap}>
      <ul className={styles.routeList}>
        {routes.map(r => (
          <li key={r.routeId} className={styles.routeItem}>
            <div className={styles.routeName}>{r.name}</div>
            <div className={styles.routeMeta}>{r.description || ""}</div>
          </li>
        ))}
        {routes.length === 0 && <div className={styles.routeEmpty}>루트가 없습니다.</div>}
      </ul>
      <button className={styles.addRouteBtn} onClick={onAdd}>+ 루트 추가</button>
    </div>
  );
}
