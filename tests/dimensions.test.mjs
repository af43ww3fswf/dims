import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_STATE,
  buildPreview,
  calculateAreaCm2,
  createDimensionSet,
  finalPresentableValue,
  formatInches,
  validateState
} from "../src/dimensions.mjs";

test("default state has no sets and override is false", () => {
  assert.deepEqual(EMPTY_STATE.sets, []);
  assert.equal(EMPTY_STATE.overrideEnabled, false);
});

test("centimetres are formatted as sixteenth-inch fractions", () => {
  assert.equal(formatInches(85), "33 7/16");
  assert.equal(formatInches(60), "23 5/8");
});

test("standard area uses height times width", () => {
  assert.equal(calculateAreaCm2({ type: "standard", heightCm: 85, widthCm: 120.5 }), 10242.5);
});

test("diameter area uses pi r squared", () => {
  assert.ok(Math.abs(calculateAreaCm2({ type: "diameter", diameterCm: 60 }) - 2827.433) < 0.01);
});

test("preview includes only selected complete sets", () => {
  const included = { ...createDimensionSet(0), heightCm: 85, widthCm: 120.5, includeInOutput: true };
  const excluded = { ...createDimensionSet(1), heightCm: 10, widthCm: 20, includeInOutput: false };
  assert.equal(buildPreview([included, excluded]).length, 1);
});

test("override requires a value and reason", () => {
  const errors = validateState({ ...EMPTY_STATE, sets: [], overrideEnabled: true });
  assert.equal(errors.length, 2);
});

test("final value uses the override only when enabled", () => {
  assert.equal(finalPresentableValue({ ...EMPTY_STATE, overrideEnabled: true, overrideValue: "Custom" }), "Custom");
});
