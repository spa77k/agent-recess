import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homeDir } from "./config.js";

export const EMPTY_STATE = {
  lastEventAt: null,
  streakStartAt: null,
  lastNudgeAt: null,
  snoozeUntil: null,
};

function statePath() {
  return join(homeDir(), "state.json");
}

export async function loadState() {
  try {
    return { ...EMPTY_STATE, ...JSON.parse(await readFile(statePath(), "utf8")) };
  } catch {
    return { ...EMPTY_STATE };
  }
}

// Several agent sessions may fire hooks at once, so write to a temp file and
// rename it into place to avoid leaving a half-written state file behind.
export async function saveState(state) {
  await mkdir(homeDir(), { recursive: true });
  const tmp = `${statePath()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(state, null, 2));
  await rename(tmp, statePath());
}
