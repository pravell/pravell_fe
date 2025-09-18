import React, { useMemo, useRef, useState } from "react";
import styles from "../PlanDetailPage.module.css";
import API from "../../../services/api";
import { DEFAULT_LEGEND as BASE_DEFAULT } from "../hooks/usePlanData";

export default function LegendBox({ planId, legend, setLegend }) {
  const DEFAULT_LEGEND = BASE_DEFAULT;
  const legendToShow = useMemo(
    () => (legend && legend.length ? [...DEFAULT_LEGEND, ...legend] : DEFAULT_LEGEND),
    [legend]
  );

  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newColor, setNewColor] = useState("#C0D86E");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editColor, setEditColor] = useState("#C0D86E");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const longPressTimers = useRef({});
  const LONG_PRESS_MS = 600;

  const attachPressHandlers = (item) => {
    const id = item.markerId ?? item.id;
    const editable = !!id;

    const start = () => {
      if (!editable) return;
      longPressTimers.current[id] = setTimeout(() => {
        setEditingId(id);
        setEditColor(item.color || "#61EB52");
        setEditDesc(item.description || "");
      }, LONG_PRESS_MS);
    };
    const cancel = () => {
      const t = longPressTimers.current[id];
      if (t) {
        clearTimeout(t);
        delete longPressTimers.current[id];
      }
    };

    return {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onContextMenu: (e) => {
        if (!editable) return;
        e.preventDefault();
        setEditingId(id);
        setEditColor(item.color || "#61EB52");
        setEditDesc(item.description || "");
      },
    };
  };

  const createMarker = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");

    const hex = newColor.trim();
    const desc = newDesc.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return alert("HEX 색상 형식 예) #61EB52");
    if (desc.length < 2 || desc.length > 30) return alert("설명은 2~30자");

    try {
      setPosting(true);
      const { data } = await API.post(`/v1/markers`, { planId, color: hex, description: desc });
      setLegend((prev) => [...prev, data]);
      setShowForm(false);
      setNewDesc("");
    } catch (e) {
      alert(e.response?.data?.message ?? "마커 생성 실패");
    } finally {
      setPosting(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("로그인이 필요합니다.");
    if (!/^#[0-9A-Fa-f]{6}$/.test(editColor)) return alert("HEX 색상 형식");

    try {
      setSaving(true);
      await API.patch(`/v1/markers/${editingId}`, {
        color: editColor.trim(),
        description: editDesc.trim(),
      });
      setLegend((prev) =>
        prev.map((m) =>
          (m.markerId ?? m.id) === editingId ? { ...m, color: editColor, description: editDesc } : m
        )
      );
      setEditingId(null);
    } catch (e) {
      alert(e.response?.data?.message ?? "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const deleteMarker = async () => {
    if (!editingId) return;
    try {
      await API.delete(`/v1/markers/${editingId}`);
      setLegend((prev) => prev.filter((m) => (m.markerId ?? m.id) !== editingId));
      setEditingId(null);
    } catch (e) {
      alert(e.response?.data?.message ?? "삭제 실패");
    }
  };

  return (
    <div className={styles.legend}>
      <div className={styles.legendHeader}>
        <button
          className={styles.legendPlus}
          onClick={() => setShowForm((v) => !v)}
          aria-label="마커 범례 추가"
        >
          +
        </button>
      </div>

      {showForm && (
        <form className={styles.legendForm} onSubmit={createMarker}>
          <div className={styles.legendFormRow}>
            <input
              type="color"
              className={styles.legendColorPicker}
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <input
              type="text"
              className={styles.legendColorInput}
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="var(--primary-color)"
              maxLength={7}
            />
          </div>
          <div className={styles.legendFormRow}>
            <input
              type="text"
              className={styles.legendDescInput}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명"
              maxLength={30}
            />
          </div>
          <div className={styles.legendFormBtns}>
            <button type="button" className={styles.legendCancelBtn} onClick={() => setShowForm(false)}>
              취소
            </button>
            <button type="submit" className={styles.legendSaveBtn} disabled={posting}>
              {posting ? "추가 중..." : "추가"}
            </button>
          </div>
          <div className={styles.legendDivider} />
        </form>
      )}

      {legendToShow.map((item, i) => {
        const id = item.markerId ?? item.id;
        const isEditing = id && id === editingId;
        return (
          <div key={i} className={styles.legendItemWrap}>
            <div
              className={`${styles.legendItem} ${id ? styles.legendItemEditable : ""}`}
              {...attachPressHandlers(item)}
              title={id ? "꾹 눌러 편집/삭제" : undefined}
            >
              <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
              <span className={styles.legendText}>{item.description}</span>
            </div>

            {isEditing && (
              <div className={styles.legendEditRow}>
                <div className={styles.legendFormRow}>
                  <input
                    type="color"
                    className={styles.legendColorPicker}
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.legendColorInput}
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    maxLength={7}
                  />
                </div>
                <div className={styles.legendFormRow}>
                  <input
                    type="text"
                    className={styles.legendDescInput}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className={styles.legendEditBtns}>
                  <button className={styles.legendDelBtn} type="button" onClick={deleteMarker}>
                    삭제
                  </button>
                  <div className={styles.legendEditSpacer} />
                  <button className={styles.legendCancelBtn} type="button" onClick={() => setEditingId(null)}>
                    취소
                  </button>
                  <button className={styles.legendSaveBtn} type="button" onClick={saveEdit} disabled={saving}>
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
                <div className={styles.legendDivider} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
