export const EMPTY_STATE = Object.freeze({
  sets: [],
  notes: "",
  overrideEnabled: false,
  overrideValue: "",
  overrideReason: "",
  overrideNote: ""
});

export function createDimensionSet(index = 0) {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `dimension-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sequence: index + 1,
    type: "standard",
    includeInOutput: true,
    framed: false,
    approximate: false,
    heightCm: "",
    widthCm: "",
    depthCm: "",
    diameterCm: ""
  };
}

export function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cmToInches(cm) {
  const value = numberOrNull(cm);
  return value === null ? null : value / 2.54;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

export function formatInches(cm, denominator = 16) {
  const inches = cmToInches(cm);
  if (inches === null) return "";

  const roundedUnits = Math.round(inches * denominator);
  const whole = Math.floor(roundedUnits / denominator);
  const numerator = roundedUnits % denominator;
  if (!numerator) return String(whole);

  const divisor = gcd(numerator, denominator);
  const fraction = `${numerator / divisor}/${denominator / divisor}`;
  return whole ? `${whole} ${fraction}` : fraction;
}

export function formatCm(value) {
  const number = numberOrNull(value);
  if (number === null) return "";
  const rounded = Math.round(number * 10) / 10;
  return String(rounded);
}

export function calculateAreaCm2(set) {
  if (set.type === "diameter") {
    const diameter = numberOrNull(set.diameterCm);
    return diameter === null ? null : Math.PI * Math.pow(diameter / 2, 2);
  }

  const height = numberOrNull(set.heightCm);
  const width = numberOrNull(set.widthCm);
  return height === null || width === null ? null : height * width;
}

export function formatArea(set) {
  const areaCm2 = calculateAreaCm2(set);
  if (areaCm2 === null) return "—";
  const areaIn2 = areaCm2 / 6.4516;
  return `${areaCm2.toLocaleString("en-GB", { maximumFractionDigits: 1 })} cm² | ${areaIn2.toLocaleString("en-GB", { maximumFractionDigits: 1 })} in²`;
}

function compact(values) {
  return values.filter((value) => value !== "");
}

export function formatDimensionSet(set) {
  let metric;
  let imperial;

  if (set.type === "diameter") {
    const diameterCm = formatCm(set.diameterCm);
    if (!diameterCm) return "";
    const metricParts = compact([`Diameter ${diameterCm}`, formatCm(set.depthCm)]);
    const imperialParts = compact([
      formatInches(set.diameterCm),
      formatInches(set.depthCm)
    ]);
    metric = `${metricParts.join(" × ")} cm`;
    imperial = `${imperialParts.join(" × ")} in.`;
  } else {
    const metricParts = compact([
      formatCm(set.heightCm),
      formatCm(set.widthCm),
      formatCm(set.depthCm)
    ]);
    if (metricParts.length === 0) return "";
    const imperialParts = compact([
      formatInches(set.heightCm),
      formatInches(set.widthCm),
      formatInches(set.depthCm)
    ]);
    metric = `${metricParts.join(" × ")} cm`;
    imperial = `${imperialParts.join(" × ")} in.`;
  }

  return `${set.approximate ? "~ " : ""}${metric} | ${imperial}${set.framed ? " (framed)" : ""}`;
}

export function buildPreview(sets) {
  return sets
    .filter((set) => set.includeInOutput)
    .sort((a, b) => a.sequence - b.sequence)
    .map(formatDimensionSet)
    .filter(Boolean);
}

export function validateState(state) {
  const errors = [];

  state.sets.forEach((set, index) => {
    const label = `Set ${index + 1}`;
    if (set.type === "diameter") {
      if (!(numberOrNull(set.diameterCm) > 0)) {
        errors.push(`${label}: diameter must be greater than zero.`);
      }
    } else if (
      !(numberOrNull(set.heightCm) > 0) ||
      !(numberOrNull(set.widthCm) > 0)
    ) {
      errors.push(`${label}: height and width must be greater than zero.`);
    }

    if (numberOrNull(set.depthCm) !== null && !(numberOrNull(set.depthCm) >= 0)) {
      errors.push(`${label}: depth cannot be negative.`);
    }
  });

  if (state.overrideEnabled && !state.overrideValue.trim()) {
    errors.push("Enter an override presentable value.");
  }
  if (state.overrideEnabled && !state.overrideReason) {
    errors.push("Select a reason for the override.");
  }

  return errors;
}

export function finalPresentableValue(state) {
  return state.overrideEnabled
    ? state.overrideValue.trim()
    : buildPreview(state.sets).join("\n");
}
