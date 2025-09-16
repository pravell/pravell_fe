import React from "react";

export default function DateFilters({ styles, dateOptions, date, isoDate, onChangeDate }) {
  return (
    <div className={styles.routeDetailDateRow}>
      <div className={styles.routeDateControls}>
        <select className={styles.routeDateSelect} value={date || ""} onChange={(e) => onChangeDate(e.target.value)}>
          <option value="">전체</option>
          {dateOptions.map((d) => <option key={d} value={d}>{d}</option>)}
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
  );
}
