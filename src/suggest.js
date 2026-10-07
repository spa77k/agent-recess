import { fallbackMessage } from "./messages.js";

const OLLAMA_URL = process.env.OLLAMA_HOST
  ? new URL("/api/generate", process.env.OLLAMA_HOST.replace(/^(?!https?:\/\/)/, "http://"))
  : new URL("http://localhost:11434/api/generate");

const LANGUAGES = { en: "English", ja: "Japanese" };

function describeWeather(w) {
  if (!w) return "Weather: unknown (no location configured).";
  return [
    `Weather: ${w.condition}, ${w.temperatureC}°C (feels like ${w.feelsLikeC}°C),`,
    `precipitation ${w.precipitationMm} mm, wind ${w.windKmh} km/h,`,
    `${w.daylight ? "daylight" : "dark outside"}${w.sunset ? `, sunset at ${w.sunset}` : ""}.`,
  ].join(" ");
}

const WET = new Set(["drizzle", "rain", "snow", "thunderstorm"]);

// Small models tend to send people out into the rain when given a list of
// options, so pick indoors or outdoors here and only ask for the wording.
function breakKind(w) {
  if (!w) return "stand up, stretch, refill water, or step outside for a moment.";
  if (WET.has(w.condition) || w.precipitationMm > 0) {
    return "something indoors, because it is wet outside — open a window, stretch, refill water, look far away. Do not suggest going out.";
  }
  if (!w.daylight) {
    return "it is dry but dark — a few minutes of night air at the door or on the balcony, or a stretch indoors.";
  }
  return "a short walk outside with a small goal (a corner shop, a park, a look at the sky).";
}

/**
 * Builds the prompt for the local model. It contains only the streak length,
 * the clock and the weather — never code, prompts or file contents.
 */
export function buildPrompt({ minutes, localTime, weather, language }) {
  return [
    "You write break reminders for a software developer who has been pairing with an AI coding agent.",
    `They have been at it for ${minutes} minutes without a real break. Local time: ${localTime}.`,
    describeWeather(weather),
    "",
    `Suggest one concrete break: ${breakKind(weather)}`,
    "Keep it to 1-3 short sentences, warm and a little playful, no lists, no markdown, no emoji.",
    "Mention the minutes once. Say how long the break should be (5-15 minutes).",
    `Write in ${LANGUAGES[language] ?? "English"}.`,
  ].join("\n");
}

export function formatLocalTime(date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Asks the local Gemma model for a break suggestion. Falls back to a fixed
 * message if Ollama is not running or does not answer within `timeoutMs`.
 */
export async function suggestBreak({ minutes, weather, config, now = new Date(), timeoutMs = 12_000 }) {
  const prompt = buildPrompt({
    minutes,
    localTime: formatLocalTime(now),
    weather,
    language: config.language,
  });

  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        think: false,
        options: { temperature: 0.9, num_predict: 160 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const text = (await res.json()).response?.trim();
    if (!text) throw new Error("Empty response");
    return { text, source: "model", prompt };
  } catch (error) {
    return { text: fallbackMessage(minutes, config.language), source: "fallback", prompt, error };
  }
}
