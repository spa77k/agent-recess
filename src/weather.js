import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homeDir } from "./config.js";

const CACHE_MS = 30 * 60_000;
const TIMEOUT_MS = 3_000;

// WMO weather interpretation codes, as used by Open-Meteo.
const WMO = [
  [[0], "clear sky"],
  [[1, 2], "partly cloudy"],
  [[3], "overcast"],
  [[45, 48], "fog"],
  [[51, 53, 55, 56, 57], "drizzle"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "rain"],
  [[71, 73, 75, 77, 85, 86], "snow"],
  [[95, 96, 99], "thunderstorm"],
];

export function describeCode(code) {
  return WMO.find(([codes]) => codes.includes(code))?.[1] ?? "unknown";
}

function cachePath() {
  return join(homeDir(), "weather.json");
}

async function readCache(config, now) {
  try {
    const cached = JSON.parse(await readFile(cachePath(), "utf8"));
    const sameSpot = cached.latitude === config.latitude && cached.longitude === config.longitude;
    if (sameSpot && now - cached.fetchedAt < CACHE_MS) return cached.weather;
  } catch {}
  return null;
}

/** Turns an Open-Meteo forecast response into the few facts the model needs. */
export function summarize(body) {
  const c = body.current;
  return {
    condition: describeCode(c.weather_code),
    temperatureC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature,
    precipitationMm: c.precipitation,
    windKmh: c.wind_speed_10m,
    daylight: c.is_day === 1,
    sunset: body.daily?.sunset?.[0]?.slice(11) ?? null,
  };
}

/**
 * Current weather at the configured spot, or null when no location is set
 * or Open-Meteo cannot be reached. Only the coordinates leave the machine.
 */
export async function getWeather(config, now = Date.now()) {
  if (config.latitude == null || config.longitude == null) return null;

  const cached = await readCache(config, now);
  if (cached) return cached;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: config.latitude,
    longitude: config.longitude,
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
    daily: "sunset",
    timezone: "auto",
    forecast_days: "1",
  });

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const weather = summarize(await res.json());
    await mkdir(homeDir(), { recursive: true });
    await writeFile(
      cachePath(),
      JSON.stringify({ latitude: config.latitude, longitude: config.longitude, fetchedAt: now, weather }),
    );
    return weather;
  } catch {
    return null;
  }
}
