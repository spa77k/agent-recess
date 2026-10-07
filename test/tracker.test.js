import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULTS } from "../src/config.js";
import { EMPTY_STATE } from "../src/state.js";
import { status, track } from "../src/tracker.js";

const MIN = 60_000;
const config = { ...DEFAULTS, thresholdMinutes: 90, breakGapMinutes: 15, cooldownMinutes: 30 };

// Simulates a prompt/stop pair every 5 minutes from `start` for `minutes`.
function work(state, start, minutes) {
  let last;
  for (let t = 0; t <= minutes; t += 5) {
    last = track(state, { event: "Stop", now: start + t * MIN, config });
    state = last.state;
  }
  return last;
}

test("first event starts a streak and does not nudge", () => {
  const r = track(EMPTY_STATE, { event: "Stop", now: 0, config });
  assert.equal(r.state.streakStartAt, 0);
  assert.equal(r.due, false);
});

test("nudges on Stop once the threshold is reached", () => {
  assert.equal(work(EMPTY_STATE, 0, 85).due, false);
  const r = work(EMPTY_STATE, 0, 90);
  assert.equal(r.due, true);
  assert.equal(r.minutes, 90);
});

test("never nudges on UserPromptSubmit", () => {
  const s = work(EMPTY_STATE, 0, 90).state;
  const r = track({ ...s, lastNudgeAt: null }, { event: "UserPromptSubmit", now: 95 * MIN, config });
  assert.equal(r.due, false);
});

test("waits for the cooldown before nudging again", () => {
  const s = work(EMPTY_STATE, 0, 90).state;
  assert.equal(work(s, 95 * MIN, 20).due, false); // up to 115 min
  assert.equal(work(s, 95 * MIN, 25).due, true); // 120 min
});

test("a gap of breakGapMinutes resets the streak", () => {
  const s = work(EMPTY_STATE, 0, 60).state;
  const r = track(s, { event: "Stop", now: 75 * MIN, config });
  assert.equal(r.state.streakStartAt, 75 * MIN);
  assert.equal(r.minutes, 0);
});

test("a shorter gap keeps the streak going", () => {
  const s = work(EMPTY_STATE, 0, 60).state;
  const r = track(s, { event: "Stop", now: 74 * MIN, config });
  assert.equal(r.state.streakStartAt, 0);
});

test("snooze suppresses the nudge", () => {
  const r = work({ ...EMPTY_STATE, snoozeUntil: 200 * MIN }, 0, 90);
  assert.equal(r.due, false);
});

test("status reports zero after a break", () => {
  const s = work(EMPTY_STATE, 0, 60).state;
  assert.equal(status(s, { now: 61 * MIN, config }).minutes, 61);
  assert.equal(status(s, { now: 80 * MIN, config }).minutes, 0);
});
