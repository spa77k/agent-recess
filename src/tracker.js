const MINUTE = 60_000;

// Events that mean "the developer is still at the keyboard with an agent".
export const TRACKED_EVENTS = new Set(["UserPromptSubmit", "Stop"]);

// Only nudge when the agent has just finished, so the message never interrupts work.
export const NUDGE_EVENT = "Stop";

/**
 * Records one hook event and decides whether to suggest a break.
 * Pure: takes the previous state and returns the next one.
 */
export function track(state, { event, now, config }) {
  const next = { ...state };

  const resting =
    state.lastEventAt === null || now - state.lastEventAt >= config.breakGapMinutes * MINUTE;
  if (resting) next.streakStartAt = now;
  next.lastEventAt = now;

  const minutes = Math.floor((now - next.streakStartAt) / MINUTE);
  const due =
    event === NUDGE_EVENT &&
    minutes >= config.thresholdMinutes &&
    (state.lastNudgeAt === null || now - state.lastNudgeAt >= config.cooldownMinutes * MINUTE) &&
    !(state.snoozeUntil !== null && now < state.snoozeUntil);

  if (due) next.lastNudgeAt = now;
  return { state: next, minutes, due };
}

/** Summary for `agent-recess status`, without recording an event. */
export function status(state, { now, config }) {
  const active =
    state.lastEventAt !== null && now - state.lastEventAt < config.breakGapMinutes * MINUTE;
  const minutes = active ? Math.floor((now - state.streakStartAt) / MINUTE) : 0;
  const snoozedMinutes =
    state.snoozeUntil !== null && now < state.snoozeUntil
      ? Math.ceil((state.snoozeUntil - now) / MINUTE)
      : 0;
  return { minutes, untilNudge: Math.max(0, config.thresholdMinutes - minutes), snoozedMinutes };
}
