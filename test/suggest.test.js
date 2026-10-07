import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { DEFAULTS } from "../src/config.js";
import { buildPrompt } from "../src/suggest.js";
import { describeCode, summarize } from "../src/weather.js";

const sunny = {
  condition: "clear sky",
  temperatureC: 21,
  feelsLikeC: 20,
  precipitationMm: 0,
  windKmh: 5,
  daylight: true,
  sunset: "17:16",
};

test("summarize keeps only the facts the model needs", () => {
  const body = {
    current: {
      temperature_2m: 18.2,
      apparent_temperature: 17.4,
      precipitation: 0,
      weather_code: 63,
      wind_speed_10m: 4.6,
      is_day: 0,
    },
    daily: { sunset: ["2026-10-07T17:16"] },
  };
  assert.deepEqual(summarize(body), {
    condition: "rain",
    temperatureC: 18.2,
    feelsLikeC: 17.4,
    precipitationMm: 0,
    windKmh: 4.6,
    daylight: false,
    sunset: "17:16",
  });
});

test("unknown weather codes do not throw", () => {
  assert.equal(describeCode(42), "unknown");
});

test("the prompt carries the streak, time, weather and language", () => {
  const prompt = buildPrompt({ minutes: 95, localTime: "14:05", weather: sunny, language: "ja" });
  assert.match(prompt, /95 minutes/);
  assert.match(prompt, /14:05/);
  assert.match(prompt, /clear sky, 21°C/);
  assert.match(prompt, /Write in Japanese/);
});

test("wet weather keeps the break indoors", () => {
  const rainy = { ...sunny, condition: "rain", precipitationMm: 2.4 };
  const prompt = buildPrompt({ minutes: 95, localTime: "14:05", weather: rainy, language: "en" });
  assert.match(prompt, /Do not suggest going out/);
  assert.doesNotMatch(prompt, /walk outside/);
  assert.match(buildPrompt({ minutes: 95, localTime: "14:05", weather: sunny, language: "en" }), /walk outside/);
});

test("the prompt works without a location", () => {
  const prompt = buildPrompt({ minutes: 90, localTime: "23:00", weather: null, language: "en" });
  assert.match(prompt, /Weather: unknown/);
});

test("falls back to a fixed message when the model is unreachable", async () => {
  // Point OLLAMA_HOST at a port nothing listens on, in a fresh module instance.
  const server = createServer().listen(0);
  const { port } = server.address();
  server.close();
  process.env.OLLAMA_HOST = `127.0.0.1:${port}`;
  const { suggestBreak } = await import(`../src/suggest.js?unreachable`);
  const result = await suggestBreak({ minutes: 90, weather: sunny, config: DEFAULTS });
  assert.equal(result.source, "fallback");
  assert.match(result.text, /90 minutes/);
});
