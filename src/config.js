import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULTS = {
  thresholdMinutes: 90,
  breakGapMinutes: 15,
  cooldownMinutes: 30,
  latitude: null,
  longitude: null,
  model: "gemma4:e2b-it-qat",
  language: "en",
};

export function homeDir() {
  return process.env.AGENT_RECESS_HOME || join(homedir(), ".agent-recess");
}

export async function loadConfig() {
  let user = {};
  try {
    user = JSON.parse(await readFile(join(homeDir(), "config.json"), "utf8"));
  } catch {
    // No config file (or an unreadable one) means defaults.
  }
  return { ...DEFAULTS, ...user };
}
