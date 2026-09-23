import { EMPTY_STATE, buildPreview, finalPresentableValue } from "./dimensions.mjs";

export const DEFAULT_MEMBER_NAMES = {
  data: "WC.DimensionsData",
  notes: "WC.DimensionsDescription",
  computed: "WC.DimensionsComputedValue",
  overrideEnabled: "WC.DimensionsUseOverride",
  overrideValue: "WC.DimensionsOverrideValue",
  overrideReason: "WC.DimensionsOverrideReason",
  overrideNote: "WC.DimensionsOverrideNote",
  presentable: "WC.DimensionsPresentableValue"
};

function readValue(entity, name, fallback) {
  const property = entity?.properties?.[name];
  if (property === undefined || property === null) return fallback;
  if (typeof property === "object" && "Invariant" in property) return property.Invariant ?? fallback;
  return property;
}

export function readState(entity, config = {}) {
  const names = { ...DEFAULT_MEMBER_NAMES, ...(config.memberNames ?? {}) };
  let parsed = {};
  try {
    parsed = JSON.parse(readValue(entity, names.data, "{}"));
  } catch {
    parsed = {};
  }

  return {
    ...EMPTY_STATE,
    ...parsed,
    sets: Array.isArray(parsed.sets) ? parsed.sets : [],
    notes: readValue(entity, names.notes, parsed.notes ?? ""),
    overrideEnabled: Boolean(readValue(entity, names.overrideEnabled, false)),
    overrideValue: readValue(entity, names.overrideValue, ""),
    overrideReason: readValue(entity, names.overrideReason, ""),
    overrideNote: readValue(entity, names.overrideNote, "")
  };
}

export function createContentHubSaveHandler(props) {
  const names = { ...DEFAULT_MEMBER_NAMES, ...(props.config?.memberNames ?? {}) };

  return async (state) => {
    if (!props.entity?.setPropertyValue) {
      throw new Error("No editable Content Hub entity is available.");
    }

    const computed = buildPreview(state.sets).join("\n");
    const serializable = {
      sets: state.sets,
      notes: state.notes
    };

    props.entity.setPropertyValue(names.data, JSON.stringify(serializable));
    props.entity.setPropertyValue(names.notes, state.notes);
    props.entity.setPropertyValue(names.computed, computed);
    props.entity.setPropertyValue(names.overrideEnabled, state.overrideEnabled);
    props.entity.setPropertyValue(names.overrideValue, state.overrideValue);
    props.entity.setPropertyValue(names.overrideReason, state.overrideReason);
    props.entity.setPropertyValue(names.overrideNote, state.overrideNote);
    props.entity.setPropertyValue(names.presentable, finalPresentableValue(state));

    props.api?.notifier?.notifySuccess?.("Dimensions updated. Save the page to commit the changes.");
  };
}
