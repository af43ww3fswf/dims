import { useMemo, useState } from "react";
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
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, value, onChange, readOnly = false, placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
      />
    </label>
  );
}

function DimensionSet({ set, index, onChange, onDelete }) {
  const update = (patch) => onChange({ ...set, ...patch });
  const isDiameter = set.type === "diameter";

  return (
    <section className="dimension-set" aria-labelledby={`set-title-${set.id}`}>
      <div className="set-heading">
        <h2 id={`set-title-${set.id}`}>Set {index + 1}</h2>
        <label className="type-select">
          <span>Dimension type</span>
          <select
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
          <Checkbox label="Mark as Framed" checked={set.framed} onChange={(v) => update({ framed: v })} />
          <Checkbox label="Mark as Approximate Size (~)" checked={set.approximate} onChange={(v) => update({ approximate: v })} />
        </div>

        <div className={`measurement-grid ${isDiameter ? "diameter" : ""}`}>
          <div className="row-label source">In cm (source)</div>
          {isDiameter ? (
            <>
              <Field label="Diameter (Ø)" value={set.diameterCm} onChange={(v) => update({ diameterCm: v })} />
              <Field label="Depth (D)" value={set.depthCm} onChange={(v) => update({ depthCm: v })} />
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
              <Field label="" value={formatInches(set.diameterCm)} readOnly />
              <Field label="" value={formatInches(set.depthCm)} readOnly />
            </>
          ) : (
            <>
              <Field label="" value={formatInches(set.heightCm)} readOnly />
              <Field label="" value={formatInches(set.widthCm)} readOnly />
              <Field label="" value={formatInches(set.depthCm)} readOnly />
            </>
          )}

          <div className="row-label">Calculated area</div>
          <output className="area-output">
            <span>{formatArea(set)}</span>
            <span className="lock" aria-label="Read only">▣</span>
          </output>
          <small className="formula">
            {isDiameter ? "π × (Diameter ÷ 2)²" : "Height × Width"}
          </small>
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
        <section className="empty-state">
          <div className="dimension-icon" aria-hidden="true">↕ □ ↔</div>
          <h2>No dimension sets added</h2>
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

      <p className="helper">ⓘ &nbsp;All dimensions are entered in centimetres and automatically converted to inches. Approximate size is set independently for each dimension set.</p>

      <div className="block-field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>DESCRIPTION / QUANTITY NOTES</span>
          <Checkbox label="Include in Output" checked={state.includeNotesInOutput} onChange={(v) => setState({ ...state, includeNotesInOutput: v })} />
        </div>
        <textarea value={state.notes} placeholder="Add notes about quantities, parts or dimensions (optional)" onChange={(e) => setState({ ...state, notes: e.target.value })} />
      </div>

      <div className="lower-grid">
        <section className="preview-panel">
          <h2>PRESENTABLE FIELD OUTPUT (PREVIEW)</h2>
          {preview.length ? preview.map((line, index) => <p key={index}>{line}</p>) : <p className="empty-copy">No dimensions to display.</p>}
        </section>

        <section className="override-panel">
          <h2>MANUAL OVERRIDE</h2>
          <Checkbox label="Enable Custom Override" checked={state.overrideEnabled} onChange={(v) => setState({ ...state, overrideEnabled: v })} />
          <div className="override-fields">
            <label className="block-field">
              <span>OVERRIDE PRESENTABLE VALUE</span>
              <textarea disabled={!state.overrideEnabled} value={state.overrideValue} placeholder="Enter the complete presentable value" onChange={(e) => setState({ ...state, overrideValue: e.target.value })} />
            </label>
            <div>
              <label className="block-field">
                <span>REASON FOR OVERRIDE (REQUIRED)</span>
                <select disabled={!state.overrideEnabled} value={state.overrideReason} onChange={(e) => setState({ ...state, overrideReason: e.target.value })}>
                  <option value="">Select a reason (required)</option>
                  {OVERRIDE_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <label className="block-field">
                <span>OVERRIDE NOTE</span>
                <textarea disabled={!state.overrideEnabled} value={state.overrideNote} placeholder="Provide details about the override (optional)" onChange={(e) => setState({ ...state, overrideNote: e.target.value })} />
              </label>
            </div>
          </div>
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
