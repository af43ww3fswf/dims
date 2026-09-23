import { useMemo, useState, useId } from "react";
import {
  EMPTY_STATE,
  buildPreview,
  createDimensionSet,
  finalPresentableValue,
  formatArea,
  formatInches,
  validateState
} from "./dimensions.mjs";
import "./styles.css";

const OVERRIDE_REASONS = [
  "Irregular shape / custom installation",
  "Artist-supplied wording",
  "Multi-part work",
  "Other"
];

function Checkbox({ label, checked, onChange }) {
  const id = useId();
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, value, onChange, readOnly = false, placeholder = "", ariaLabel }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label && <span>{label}</span>}
      <input
        id={id}
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : 0}
        aria-label={ariaLabel || label || undefined}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
      />
    </label>
  );
}

function DimensionSet({ set, index, onChange, onDelete }) {
  const update = (patch) => onChange({ ...set, ...patch });
  const isDiameter = set.type === "diameter";
  const typeId = useId();

  return (
    <section className="dimension-set" aria-labelledby={`set-title-${set.id}`}>
      <div className="set-heading">
        <h2 id={`set-title-${set.id}`}>Set {index + 1}</h2>
        <label className="type-select" htmlFor={typeId}>
          <span>Dimension type</span>
          <select
            id={typeId}
            value={set.type}
            onChange={(e) =>
              update(
                e.target.value === "diameter"
                  ? { type: "diameter", heightCm: "", widthCm: "" }
                  : { type: "standard", diameterCm: "" }
              )
            }
          >
            <option value="standard">Standard (H × W × D)</option>
            <option value="diameter">Diameter (Ø × D)</option>
          </select>
        </label>
        <button className="icon-button" type="button" onClick={onDelete} aria-label={`Delete set ${index + 1}`}>
          <span aria-hidden="true">⌫</span>
        </button>
      </div>

      <div className="set-body">
        <div className="set-options">
          <Checkbox label="Include in Output" checked={set.includeInOutput} onChange={(v) => update({ includeInOutput: v })} />
          <Checkbox label="Show as Framed" checked={set.framed} onChange={(v) => update({ framed: v })} />
          <Checkbox label="Mark as Approximate Size (~)" checked={set.approximate} onChange={(v) => update({ approximate: v })} />
        </div>

        <div className={`measurement-grid ${isDiameter ? "diameter" : ""}`}>
          <div className="row-label source">In cm (source)</div>
          {isDiameter ? (
            <>
              <Field label="Diameter (Ø)" value={set.diameterCm} onChange={(v) => update({ diameterCm: v })} />
              <Field label="Depth (D)" value={set.depthCm} onChange={(v) => update({ depthCm: v })} />
              <div />
            </>
          ) : (
            <>
              <Field label="Height (H)" value={set.heightCm} onChange={(v) => update({ heightCm: v })} />
              <Field label="Width (W)" value={set.widthCm} onChange={(v) => update({ widthCm: v })} />
              <Field label="Depth (D)" value={set.depthCm} onChange={(v) => update({ depthCm: v })} />
            </>
          )}

          <div className="row-label">Auto-converted in.</div>
          {isDiameter ? (
            <>
              <Field label="" ariaLabel="Auto-converted diameter in inches" value={formatInches(set.diameterCm)} readOnly />
              <Field label="" ariaLabel="Auto-converted depth in inches" value={formatInches(set.depthCm)} readOnly />
              <div />
            </>
          ) : (
            <>
              <Field label="" ariaLabel="Auto-converted height in inches" value={formatInches(set.heightCm)} readOnly />
              <Field label="" ariaLabel="Auto-converted width in inches" value={formatInches(set.widthCm)} readOnly />
              <Field label="" ariaLabel="Auto-converted depth in inches" value={formatInches(set.depthCm)} readOnly />
            </>
          )}

          <div className="row-label">Area</div>
          <div style={{ gridColumn: "span 2" }}>
            <Field label="" ariaLabel="Calculated Area" value={formatArea(set)} readOnly />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App({ initialState = EMPTY_STATE, onSave = async () => {} }) {
  const [state, setState] = useState(() => ({ ...EMPTY_STATE, ...initialState, sets: initialState.sets ?? [] }));
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState("");
  const preview = useMemo(() => buildPreview(state), [state]);
  
  const overrideValueId = useId();
  const overrideReasonId = useId();
  const overrideNoteId = useId();

  const updateSet = (index, nextSet) => {
    setState((current) => ({
      ...current,
      sets: current.sets.map((set, position) => (position === index ? nextSet : set))
    }));
  };

  const deleteSet = (index) => {
    setState((current) => ({
      ...current,
      sets: current.sets
        .filter((_, position) => position !== index)
        .map((set, position) => ({ ...set, sequence: position + 1 }))
    }));
  };

  const save = async () => {
    const nextErrors = validateState(state);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    setStatus("Saving…");
    try {
      await onSave({ ...state, presentableValue: finalPresentableValue(state) });
      setStatus("Saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save");
    }
  };

  return (
    <main className="dimensions-app">
      <h1>DIMENSIONS &amp; SIZING</h1>

      {state.sets.length === 0 ? (
        <section className="empty-state" aria-labelledby="empty-state-heading">
          <div className="dimension-icon" aria-hidden="true">↕ □ ↔</div>
          <h2 id="empty-state-heading">No dimension sets added</h2>
          <p>Add a dimension set to enter the artwork measurements.</p>
          <button className="primary" type="button" onClick={() => setState((s) => ({ ...s, sets: [createDimensionSet(0)] }))}>
            + Add dimension set
          </button>
        </section>
      ) : (
        <>
          <div className="sets">
            {state.sets.map((set, index) => (
              <DimensionSet key={set.id} set={set} index={index} onChange={(next) => updateSet(index, next)} onDelete={() => deleteSet(index)} />
            ))}
          </div>
          <button className="add-set" type="button" onClick={() => setState((s) => ({ ...s, sets: [...s.sets, createDimensionSet(s.sets.length)] }))}>
            + Add dimension set
          </button>
        </>
      )}

      <p className="helper">ⓘ &nbsp;All dimensions are entered in centimetres and automatically converted to inches.</p>

      <div className="block-field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span id="notes-label">DESCRIPTION / QUANTITY NOTES</span>
          <Checkbox label="Include in Output" checked={state.includeNotesInOutput} onChange={(v) => setState({ ...state, includeNotesInOutput: v })} />
        </div>
        <textarea aria-labelledby="notes-label" value={state.notes} placeholder="Add notes about quantities, parts or dimensions (optional)" onChange={(e) => setState({ ...state, notes: e.target.value })} />
      </div>

      <div className="lower-grid">
        <section className="preview-panel" aria-labelledby="preview-heading">
          <h2 id="preview-heading">AUTO GENERATED OUTPUT PREVIEW</h2>
          {preview.length ? preview.map((line, index) => <p key={index}>{line}</p>) : <p className="empty-copy">No dimensions to display.</p>}
        </section>

        <section className="override-panel" aria-labelledby="override-heading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="override-heading">MANUAL OVERRIDE</h2>
            <Checkbox label="Enable Custom Override" checked={state.overrideEnabled} onChange={(v) => setState({ ...state, overrideEnabled: v })} />
          </div>
          {state.overrideEnabled && (
            <div className="override-fields">
              <label className="block-field full-width" htmlFor={overrideValueId}>
                <span>OVERRIDE PRESENTABLE VALUE</span>
                <textarea id={overrideValueId} disabled={!state.overrideEnabled} value={state.overrideValue} placeholder="Enter the complete presentable value" onChange={(e) => setState({ ...state, overrideValue: e.target.value })} />
              </label>
              <label className="block-field" htmlFor={overrideReasonId}>
                <span>REASON FOR OVERRIDE (REQUIRED)</span>
                <select id={overrideReasonId} disabled={!state.overrideEnabled} value={state.overrideReason} onChange={(e) => setState({ ...state, overrideReason: e.target.value })}>
                  <option value="">Select a reason (required)</option>
                  {OVERRIDE_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <label className="block-field" htmlFor={overrideNoteId}>
                <span>OVERRIDE NOTE</span>
                <textarea id={overrideNoteId} disabled={!state.overrideEnabled} value={state.overrideNote} placeholder="Provide details about the override (optional)" onChange={(e) => setState({ ...state, overrideNote: e.target.value })} />
              </label>
            </div>
          )}
        </section>
      </div>

      {errors.length > 0 && <div className="errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}

      <footer>
        <span className="status" aria-live="polite">{status}</span>
        <button className="primary" type="button" onClick={save}>Save</button>
        <button className="secondary" type="button" onClick={() => setState({ ...EMPTY_STATE, sets: [] })}>Cancel</button>
      </footer>
    </main>
  );
}
