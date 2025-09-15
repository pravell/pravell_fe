import React, { useState } from "react";
import styles from "../PlanDetailPage.module.css";

export default function CreateRouteModal({ open, onClose, onSubmit, creating }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  if (!open) return null;

  const submit = async () => { await onSubmit(name, desc); setName(""); setDesc(""); };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <h3 className={styles.modalTitle}>루트 추가</h3>
        <input className={styles.modalInput} placeholder="루트 이름" value={name} onChange={e=>setName(e.target.value)} maxLength={30}/>
        <input className={styles.modalInput} placeholder="설명(선택)" value={desc} onChange={e=>setDesc(e.target.value)} maxLength={50}/>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>취소</button>
          <button className={styles.modalConfirm} onClick={submit} disabled={creating}>{creating ? "생성중..." : "생성"}</button>
        </div>
      </div>
    </div>
  );
}
