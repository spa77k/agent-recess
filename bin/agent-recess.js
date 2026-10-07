#!/usr/bin/env node
import { loadConfig } from "../src/config.js";
import { loadState, saveState } from "../src/state.js";
import { suggestBreak } from "../src/suggest.js";
import { status, track, TRACKED_EVENTS } from "../src/tracker.js";
import { getWeather } from "../src/weather.js";

const USAGE = `Usage: agent-recess <command>

Commands:
  hook             Run as a coding-agent hook (reads the hook JSON on stdin)
  status           Show the current coding streak
  snooze [min]     Pause break suggestions (default: 60 minutes)
  preview [min]    Generate a suggestion now and show exactly what the model saw`;

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

// Returns the hook's JSON output. Codex rejects plain text on Stop, and Claude
// Code would feed plain text on UserPromptSubmit to the model, so always JSON.
async function runHook() {
  const input = JSON.parse((await readStdin()) || "{}");
  const event = input.hook_event_name;
  if (!TRACKED_EVENTS.has(event)) return {};

  const config = await loadConfig();
  const result = track(await loadState(), { event, now: Date.now(), config });
  await saveState(result.state);
  if (!result.due) return {};

  const weather = await getWeather(config);
  const { text } = await suggestBreak({ minutes: result.minutes, weather, config });
  return { systemMessage: `🌿 ${text}` };
}

async function runStatus() {
  const config = await loadConfig();
  const s = status(await loadState(), { now: Date.now(), config });
  console.log(`Coding streak: ${s.minutes} min`);
  console.log(`Next break suggestion in: ${s.untilNudge} min`);
  if (s.snoozedMinutes > 0) console.log(`Snoozed for: ${s.snoozedMinutes} min`);
}

async function runSnooze(arg) {
  const minutes = Number(arg ?? 60);
  if (!Number.isFinite(minutes) || minutes < 0) throw new Error(`Not a number of minutes: ${arg}`);
  const state = await loadState();
  await saveState({ ...state, snoozeUntil: minutes === 0 ? null : Date.now() + minutes * 60_000 });
  console.log(minutes === 0 ? "Snooze cleared." : `Break suggestions paused for ${minutes} min.`);
}

async function runPreview(arg) {
  const config = await loadConfig();
  const minutes = Number(arg ?? config.thresholdMinutes);
  const weather = await getWeather(config);
  const result = await suggestBreak({ minutes, weather, config });
  console.log("--- Sent to the model (nothing else leaves this prompt) ---");
  console.log(result.prompt);
  console.log(`\n--- Suggestion (${result.source === "model" ? config.model : "fallback"}) ---`);
  console.log(result.text);
  if (result.error) console.error(`\n(Ollama unavailable: ${result.error.message})`);
}

const [command, arg] = process.argv.slice(2);
try {
  if (command === "hook") {
    // A hook must never break the agent, so swallow every error and exit 0.
    process.stdout.write(JSON.stringify(await runHook().catch(() => ({}))));
  } else if (command === "status") {
    await runStatus();
  } else if (command === "snooze") {
    await runSnooze(arg);
  } else if (command === "preview") {
    await runPreview(arg);
  } else {
    console.log(USAGE);
    process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
