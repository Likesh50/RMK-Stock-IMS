import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditableReportCell = ({ value, sourceType, recordId, field, onSaved, align = 'left', itemId, extraValues = {} }) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => setDraft(value == null ? '' : String(value)), [value]);
  const save = async () => {
    if (String(value ?? '') === draft || !recordId) return;
    setSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_RMK_MESS_URL}/report/updateRecord`, {
        source_type: sourceType, record_id: recordId,
        values: { [field]: draft, ...extraValues, ...(itemId ? { item_id: itemId } : {}) }
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` }
      });
      onSaved?.(draft);
      setFailed(false);
    } catch (error) {
      setFailed(true);
      setDraft(value == null ? '' : String(value));
      console.error('Failed to save report cell:', error);
      if (error.response?.status === 401) {
        ['token', 'role', 'uname', 'userlocations'].forEach(key => sessionStorage.removeItem(key));
        navigate('/', { replace: true, state: { authMessage: 'Your session expired. Please sign in again before editing reports.' } });
      }
    } finally { setSaving(false); }
  };
  return <input
    value={draft} placeholder={value == null ? 'N/A' : undefined} disabled={saving} aria-label={`Edit ${field}`} aria-invalid={failed}
    title={failed ? 'Could not save this value' : 'Edit and leave the field to save'}
    onChange={event => { setDraft(event.target.value); setFailed(false); }}
    onBlur={save}
    onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setDraft(value == null ? '' : String(value)); event.currentTarget.blur(); } }}
    style={{ width: '100%', minWidth: 50, boxSizing: 'border-box', padding: '2px 4px', border: failed ? '1px solid #b42318' : '1px solid transparent', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: align }}
  />;
};
export default EditableReportCell;
