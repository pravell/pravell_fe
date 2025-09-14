import React from 'react';
import styles from '../PlanDetailPage.module.css';
const dayKo = { Monday:'월', Tuesday:'화', Wednesday:'수', Thursday:'목', Friday:'금', Saturday:'토', Sunday:'일' };

export default function PlaceDetail({
  detail,
  loading,
  onBack,
  onFlyTo,
  editing,
  setEditing,
  showDeleteConfirm,
  setShowDeleteConfirm,
  form, setForm,
  onSave,
  saving,
  onDelete,
  deleting,
}) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderRow}>
          <button className={styles.detailBackBtn} onClick={onBack} aria-label="뒤로">‹</button>

          {!editing && (
            <div className={styles.detailActions}>
              <button className={styles.textBtn} onClick={() => setEditing(true)}>수정</button>
              <button className={styles.textBtnDanger} onClick={() => setShowDeleteConfirm(true)}>삭제</button>
            </div>
          )}
        </div>
      </div>

      <h3 className={styles.detailTitle}>{detail?.nickname || detail?.title || '장소 상세'}</h3>

      {showDeleteConfirm && (
        <div className={styles.inlineConfirm}>
          <span>정말 삭제할까요?</span>
          <div className={styles.inlineConfirmBtns}>
            <button className={styles.legendCancelBtn} onClick={() => setShowDeleteConfirm(false)}>취소</button>
            <button className={styles.legendDelBtn} onClick={onDelete} disabled={deleting}>
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.detailEditForm}>
          <div className={styles.editRow}>
            <label className={styles.rowLabel}>별칭</label>
            <input
              type="text"
              className={styles.rowValueInput}
              value={form.nickname}
              onChange={(e)=>setForm(s=>({ ...s, nickname: e.target.value }))}
              placeholder="별칭 (선택)"
              maxLength={30}
            />
          </div>

          <div className={styles.editRow}>
            <label className={styles.rowLabel}>핀 색상</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.legendColorPicker}
                value={form.pinColor}
                onChange={(e)=>setForm(s=>({ ...s, pinColor: e.target.value }))}
              />
              <input
                type="text"
                className={styles.legendColorInput}
                value={form.pinColor}
                onChange={(e)=>setForm(s=>({ ...s, pinColor: e.target.value }))}
                maxLength={7}
              />
            </div>
          </div>

          <div className={styles.editRow}>
            <label className={styles.rowLabel}>메모</label>
            <textarea
              rows={3}
              className={styles.descTextarea}
              value={form.description}
              onChange={(e)=>setForm(s=>({ ...s, description: e.target.value }))}
              maxLength={255}
              placeholder="설명 (선택)"
            />
          </div>

          <div className={styles.legendFormBtns}>
            <button className={styles.legendCancelBtn} type="button" onClick={()=>setEditing(false)}>취소</button>
            <button className={styles.legendSaveBtn} type="button" onClick={onSave} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>

          <div className={styles.legendDivider} />
        </div>
      )}

      {loading && <div className={styles.empty}>불러오는 중…</div>}

      {!loading && detail && (
        <>
          {(detail.address || detail.roadAddress || detail.roadAddredd) && (
            <>
              {detail.address && (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>주소</span>
                  <span className={styles.rowValue}>{detail.address}</span>
                </div>
              )}
              {(detail.roadAddress || detail.roadAddredd) && (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>도로명 주소</span>
                  <span className={styles.rowValue}>{detail.roadAddress || detail.roadAddredd}</span>
                </div>
              )}
            </>
          )}

          {Array.isArray(detail.hours) && detail.hours.length > 0 && (
            <div className={styles.hoursBlock}>
              <div className={styles.rowLabel}>영업 시간</div>
              <div className={styles.hoursList}>
                {detail.hours.map((h,i)=>{
                  if (h==='정보 없음') return <div key={i} className={styles.hourLine}>정보 없음</div>;
                  const [d,t=''] = String(h).split(': ');
                  return (
                    <div key={i} className={styles.hourLine}>
                      <span className={styles.hourDay}>{dayKo[d] ?? d}</span>
                      <span className={styles.hourTime}>{t}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detail.description && <div className={styles.memo}>{detail.description}</div>}

          <div style={{ marginTop: 12 }}>
            <button className={styles.legendSaveBtn} onClick={onFlyTo}>지도에서 보기</button>
          </div>
        </>
      )}
    </div>
  );
}
