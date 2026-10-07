import { useEffect, useState } from 'react';
import axios from 'axios';

function EditableReportValue({ value, overrideKey, field, onSaved }) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setDraft(value == null ? '' : String(value));
  }, [value]);

  const saveValue = async () => {
    if (!overrideKey || draft.trim() === '') return;

    const numericValue = Number(draft);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setDraft(value == null ? '' : String(value));
      setSaveError(true);
      return;
    }

    if (value != null && numericValue === Number(value)) return;

    setSaving(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_RMK_MESS_URL}/report/valueOverride`,
        { override_key: overrideKey, field, value: numericValue }
      );
      onSaved?.(response.data.value);
      setSaveError(false);
    } catch (error) {
      console.error('Failed to save report value:', error);
      setDraft(value == null ? '' : String(value));
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={value == null ? 'N/A' : undefined}
      disabled={saving}
      aria-label={`Edit ${field}`}
      aria-invalid={saveError}
      title={saveError ? 'Could not save this value' : 'Edit and leave the field to save'}
      onChange={event => {
        setDraft(event.target.value);
        setSaveError(false);
      }}
      onBlur={saveValue}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(value == null ? '' : String(value));
          event.currentTarget.blur();
        }
      }}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 48,
        padding: '2px 4px',
        border: saveError ? '1px solid #b42318' : '1px solid transparent',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'right'
      }}
    />
  );
}

export default EditableReportValue;