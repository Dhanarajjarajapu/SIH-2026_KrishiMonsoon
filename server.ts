import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

dotenv.config();

// Standard WMO Weather Code Table
const WMO_CODE_TABLE: Record<number, { condition: string; emoji: string }> = {
  0: { condition: "Clear sky", emoji: "☀️" },
  1: { condition: "Mainly clear", emoji: "🌤️" },
  2: { condition: "Partly cloudy", emoji: "⛅" },
  3: { condition: "Overcast", emoji: "☁️" },
  45: { condition: "Fog", emoji: "🌫️" },
  48: { condition: "Depositing rime fog", emoji: "🌫️" },
  51: { condition: "Light drizzle", emoji: "🌦️" },
  53: { condition: "Moderate drizzle", emoji: "🌦️" },
  55: { condition: "Dense drizzle", emoji: "🌧️" },
  56: { condition: "Light freezing drizzle", emoji: "🌧️❄️" },
  57: { condition: "Dense freezing drizzle", emoji: "🌧️❄️" },
  61: { condition: "Slight rain", emoji: "🌧️" },
  63: { condition: "Moderate rain", emoji: "🌧️" },
  65: { condition: "Heavy rain", emoji: "🌧️🌧️" },
  66: { condition: "Light freezing rain", emoji: "🌧️❄️" },
  67: { condition: "Heavy freezing rain", emoji: "🌧️❄️" },
  71: { condition: "Slight snow fall", emoji: "🌨️" },
  73: { condition: "Moderate snow fall", emoji: "🌨️" },
  75: { condition: "Heavy snow fall", emoji: "❄️❄️" },
  77: { condition: "Snow grains", emoji: "❄️" },
  80: { condition: "Slight rain showers", emoji: "🌦️" },
  81: { condition: "Moderate rain showers", emoji: "🌧️" },
  82: { condition: "Violent rain showers", emoji: "⛈️" },
  85: { condition: "Slight snow showers", emoji: "🌨️" },
  86: { condition: "Heavy snow showers", emoji: "❄️🌨️" },
  95: { condition: "Thunderstorm", emoji: "⛈️" },
  96: { condition: "Thunderstorm with slight hail", emoji: "⛈️🧊" },
  99: { condition: "Thunderstorm with heavy hail", emoji: "⛈️⚠️" },
};

function decodeWMOCode(code: number): { condition: string; emoji: string } {
  return WMO_CODE_TABLE[code] || { condition: "Partly cloudy", emoji: "⛅" };
}

export interface ClimateIndices {
  enso: { phase: string; strength: string; oni: number };
  iod: { phase: string; dmi: number };
  mjo: { phase: number; amplitude: number };
  note: string;
}

export interface DailyForecastDay {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  emoji: string;
  precipitation?: number;
  windSpeedMax?: number;
  weatherCode?: number;
}

export interface WeatherDataResponse {
  success: boolean;
  locationName: string;
  country?: string;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    conditionText: string;
    emoji: string;
    humidity?: number;
  };
  daily: {
    time: string[];
    maxTemp: number[];
    minTemp: number[];
    precipitationSum: number[];
    windSpeedMax: number[];
    conditions: string[];
  };
  forecast14Day?: DailyForecastDay[];
  alerts: Array<{
    type: "heavy_rain" | "high_wind" | "heatwave" | "cold_wave";
    title: string;
    severity: "warning" | "advisory";
    value: string;
    threshold: string;
    advisoryText: string;
  }>;
  error?: string;
}

export interface MonsoonOutlookResponse {
  success: boolean;
  location: string;
  country?: string;
  latitude: number;
  longitude: number;
  onset_probability_pct: number;
  break_probability_pct: number;
  heavy_rain_probability_pct: number;
  heavy_rain_dates: string[];
  confidence: "low" | "medium" | "high";
  window_days: number;
  rationale: string;
  climate_indices: ClimateIndices;
  daily_rainfall: Array<{
    date: string;
    dayName: string;
    rain_mm: number;
    max_temp: number;
    min_temp: number;
    condition: string;
    emoji: string;
    wind_kmh: number;
  }>;
  error?: string;
}

export interface RiskGridPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  risk_category: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  onset_probability_pct: number;
  break_probability_pct: number;
  heavy_rain_flag: boolean;
  confidence: "low" | "medium" | "high";
  rationale?: string;
}

export interface CropAdvisoryResponse {
  success: boolean;
  location: string;
  crop: string;
  growth_stage: string;
  risk_category: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  action: string;
  details: string;
  heavy_rain_flag: boolean;
  rule_applied: string;
}

// Language Specification Mapping
export interface LanguageSpec {
  code: string;
  name: string;
  speechCode: string;
  scriptName: string;
  detectRegex?: RegExp;
}

export const LANGUAGE_SPECS: Record<string, LanguageSpec> = {
  hi: { code: "hi", name: "Hindi", speechCode: "hi-IN", scriptName: "हिन्दी", detectRegex: /[\u0900-\u097F]/ },
  te: { code: "te", name: "Telugu", speechCode: "te-IN", scriptName: "తెలుగు", detectRegex: /[\u0C00-\u0C7F]/ },
  ta: { code: "ta", name: "Tamil", speechCode: "ta-IN", scriptName: "தமிழ்", detectRegex: /[\u0B80-\u0BFF]/ },
  mr: { code: "mr", name: "Marathi", speechCode: "mr-IN", scriptName: "मराठी", detectRegex: /[\u0900-\u097F]/ },
  bn: { code: "bn", name: "Bengali", speechCode: "bn-IN", scriptName: "বাংলা", detectRegex: /[\u0980-\u09FF]/ },
  gu: { code: "gu", name: "Gujarati", speechCode: "gu-IN", scriptName: "ગુજરાતી", detectRegex: /[\u0A80-\u0AFF]/ },
  kn: { code: "kn", name: "Kannada", speechCode: "kn-IN", scriptName: "ಕನ್ನಡ", detectRegex: /[\u0C80-\u0CFF]/ },
  en: { code: "en", name: "English", speechCode: "en-IN", scriptName: "English" },
};

/**
 * Robust Language Detection supporting regional Indian languages & manual overrides
 */
export function detectLanguage(text: string, manualOverride?: string): LanguageSpec {
  if (manualOverride && manualOverride !== "auto" && LANGUAGE_SPECS[manualOverride]) {
    return LANGUAGE_SPECS[manualOverride];
  }

  if (!text) return LANGUAGE_SPECS.en;

  // 1. Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return LANGUAGE_SPECS.te;

  // 2. Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return LANGUAGE_SPECS.ta;

  // 3. Bengali
  if (/[\u0980-\u09FF]/.test(text)) return LANGUAGE_SPECS.bn;

  // 4. Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) return LANGUAGE_SPECS.gu;

  // 5. Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return LANGUAGE_SPECS.kn;

  // 6. Devanagari: Differentiate Marathi from Hindi
  if (/[\u0900-\u097F]/.test(text)) {
    if (
      text.includes("ळ") ||
      /\b(आहे|नाही|शेतकरी|पाहिजे|पाऊस|हवामान|कधी|येणार|काय|पीक|जमीन|सल्ला|पेरणी|अवकाळी)\b/i.test(text)
    ) {
      return LANGUAGE_SPECS.mr;
    }
    return LANGUAGE_SPECS.hi;
  }

  return LANGUAGE_SPECS.en;
}

// -------------------------------------------------------------
// TOOL 1: get_weather
// -------------------------------------------------------------
export async function get_weather(location: string, days: number = 7): Promise<WeatherDataResponse> {
  const cleanLoc = (location || "Nashik").trim();
  const clampedDays = Math.min(Math.max(days || 7, 1), 16);

  try {
    const coordMatch = cleanLoc.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    let lat: number;
    let lon: number;
    let resolvedName = cleanLoc;
    let country = "India";

    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lon = parseFloat(coordMatch[2]);
      try {
        const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          lat.toFixed(2)
        )}&count=1`;
        const revRes = await fetch(revUrl);
        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData?.results?.[0]?.name) {
            resolvedName = `${revData.results[0].name} Block (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
            country = revData.results[0].country || "India";
          } else {
            resolvedName = `Block (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          }
        }
      } catch (_) {
        resolvedName = `Block (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      }
    } else {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLoc)}&count=6`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        throw new Error(`Geocoding lookup failed with status ${geoRes.status}`);
      }

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return {
          success: false,
          locationName: cleanLoc,
          latitude: 0,
          longitude: 0,
          current: { temperature: 0, windspeed: 0, weathercode: 0, conditionText: "Unknown", emoji: "❓" },
          daily: { time: [], maxTemp: [], minTemp: [], precipitationSum: [], windSpeedMax: [], conditions: [] },
          forecast14Day: [],
          alerts: [],
          error: `Could not geocode "${cleanLoc}". Please include district or state name (e.g. "Warangal, Telangana" or "Nashik, Maharashtra").`,
        };
      }

      const place =
        geoData.results.find((r: any) => r.country_code === "IN" && r.name.toLowerCase() === cleanLoc.toLowerCase()) ||
        geoData.results.find((r: any) => r.country_code === "IN") ||
        geoData.results[0];

      lat = place.latitude;
      lon = place.longitude;
      resolvedName = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`;
      country = place.country || "India";
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation,temperature_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&forecast_days=${clampedDays}&timezone=auto`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) {
      throw new Error(`Forecast lookup failed with HTTP ${forecastRes.status}`);
    }

    const data = await forecastRes.json();
    const curr = data.current_weather || {};
    const wmo = decodeWMOCode(curr.weathercode || 0);

    const dailyTime: string[] = data.daily?.time || [];
    const maxTemp: number[] = data.daily?.temperature_2m_max || [];
    const minTemp: number[] = data.daily?.temperature_2m_min || [];
    const precipSum: number[] = data.daily?.precipitation_sum || [];
    const windMax: number[] = data.daily?.windspeed_10m_max || [];
    const dailyWeatherCodes: number[] = data.daily?.weathercode || [];

    const conditions: string[] = dailyWeatherCodes.map((c) => decodeWMOCode(c).condition);

    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const forecast14Day: DailyForecastDay[] = dailyTime.map((dateStr: string, idx: number) => {
      const d = new Date(dateStr);
      const dayName = idx === 0 ? "Today" : dayNamesShort[d.getDay()] || dateStr;
      const code = dailyWeatherCodes[idx] ?? 0;
      const decoded = decodeWMOCode(code);
      return {
        date: dateStr,
        dayName,
        maxTemp: maxTemp[idx] !== undefined ? Math.round(maxTemp[idx]) : Math.round(curr.temperature || 30),
        minTemp: minTemp[idx] !== undefined ? Math.round(minTemp[idx]) : Math.round((curr.temperature || 30) - 5),
        condition: conditions[idx] || decoded.condition,
        emoji: decoded.emoji,
        precipitation: precipSum[idx] !== undefined ? Number(precipSum[idx].toFixed(1)) : 0,
        windSpeedMax: windMax[idx] !== undefined ? Math.round(windMax[idx]) : 0,
        weatherCode: code,
      };
    });

    const alerts: WeatherDataResponse["alerts"] = [];
    const maxPrecip = precipSum.length > 0 ? Math.max(...precipSum) : 0;
    if (maxPrecip > 50) {
      alerts.push({
        type: "heavy_rain",
        title: "Heavy rain warning",
        severity: "warning",
        value: `${maxPrecip.toFixed(1)} mm/day`,
        threshold: "> 50 mm/day",
        advisoryText: "Heavy downpours expected. Waterlogging likely; clear field drainage and delay spraying.",
      });
    }

    const peakWind = windMax.length > 0 ? Math.max(...windMax) : curr.windspeed || 0;
    if (peakWind > 60) {
      alerts.push({
        type: "high_wind",
        title: "High wind advisory",
        severity: "advisory",
        value: `${Math.round(peakWind)} km/h`,
        threshold: "> 60 km/h",
        advisoryText: "Strong wind gusts predicted. Stake tall standing crops (sugarcane/banana/maize).",
      });
    }

    const peakTemp = maxTemp.length > 0 ? Math.max(...maxTemp) : curr.temperature || 0;
    if (peakTemp > 40) {
      alerts.push({
        type: "heatwave",
        title: "Heatwave advisory",
        severity: "advisory",
        value: `${peakTemp.toFixed(1)}°C`,
        threshold: "> 40°C",
        advisoryText: "Extreme heatwave conditions. Maintain shallow standing water in paddy; irrigate during evening.",
      });
    }

    return {
      success: true,
      locationName: resolvedName,
      country,
      latitude: lat,
      longitude: lon,
      current: {
        temperature: curr.temperature !== undefined ? Math.round(curr.temperature * 10) / 10 : 28.0,
        windspeed: curr.windspeed !== undefined ? Math.round(curr.windspeed * 10) / 10 : 12.0,
        weathercode: curr.weathercode || 0,
        conditionText: wmo.condition,
        emoji: wmo.emoji,
      },
      daily: {
        time: dailyTime,
        maxTemp,
        minTemp,
        precipitationSum: precipSum,
        windSpeedMax: windMax,
        conditions,
      },
      forecast14Day,
      alerts,
    };
  } catch (err: any) {
    return {
      success: false,
      locationName: cleanLoc,
      latitude: 0,
      longitude: 0,
      current: { temperature: 0, windspeed: 0, weathercode: 0, conditionText: "Unavailable", emoji: "⚠️" },
      daily: { time: [], maxTemp: [], minTemp: [], precipitationSum: [], windSpeedMax: [], conditions: [] },
      forecast14Day: [],
      alerts: [],
      error: err.message || "Failed to fetch weather data",
    };
  }
}

// -------------------------------------------------------------
// TOOL 2: get_climate_indices
// -------------------------------------------------------------
export function get_climate_indices(): ClimateIndices {
  return {
    enso: { phase: "La Niña", strength: "weak", oni: -0.6 },
    iod: { phase: "Neutral", dmi: 0.1 },
    mjo: { phase: 3, amplitude: 1.2 },
    note: "DEMO DATA — production integrates NOAA CPC ONI, BOM IOD/MJO feeds",
  };
}

// -------------------------------------------------------------
// TOOL 3: get_monsoon_outlook
// -------------------------------------------------------------
export async function get_monsoon_outlook(location: string): Promise<MonsoonOutlookResponse> {
  const weather = await get_weather(location, 14);
  const climate = get_climate_indices();

  if (!weather.success) {
    return {
      success: false,
      location: location,
      latitude: 0,
      longitude: 0,
      onset_probability_pct: 0,
      break_probability_pct: 0,
      heavy_rain_probability_pct: 0,
      heavy_rain_dates: [],
      confidence: "low",
      window_days: 14,
      rationale: weather.error || "Location could not be resolved.",
      climate_indices: climate,
      daily_rainfall: [],
      error: weather.error,
    };
  }

  const precip = weather.daily.precipitationSum || [];
  const times = weather.daily.time || [];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // 1. ONSET SIGNAL RULE
  let hasConsecutiveOnsetDays = false;
  for (let i = 0; i < precip.length - 1; i++) {
    if (precip[i] >= 15 && precip[i + 1] >= 15) {
      const next5Sum = precip.slice(i + 2, i + 7).reduce((acc, v) => acc + (v || 0), 0);
      if (next5Sum >= 50) {
        hasConsecutiveOnsetDays = true;
        break;
      }
    }
  }

  let rawOnsetProb = 25;
  if (hasConsecutiveOnsetDays) {
    rawOnsetProb = 80;
  } else {
    const first7Sum = precip.slice(0, 7).reduce((acc, v) => acc + (v || 0), 0);
    const anyModerateRain = precip.some((p) => p >= 15);
    if (first7Sum >= 40 || (anyModerateRain && first7Sum >= 25)) {
      rawOnsetProb = 55;
    } else if (first7Sum >= 15) {
      rawOnsetProb = 35;
    } else {
      rawOnsetProb = 15;
    }
  }

  // 2. BREAK SIGNAL RULE
  let has5DayDryBreak = false;
  for (let i = 0; i <= precip.length - 5; i++) {
    const fiveDay = precip.slice(i, i + 5);
    const fiveDayAvg = fiveDay.reduce((a, b) => a + (b || 0), 0) / 5;
    if (fiveDayAvg < 1.0) {
      has5DayDryBreak = true;
      break;
    }
  }

  let rawBreakProb = 20;
  if (has5DayDryBreak) {
    const totalRain = precip.reduce((a, b) => a + (b || 0), 0);
    if (totalRain < 8) {
      rawBreakProb = 85;
    } else {
      rawBreakProb = 65;
    }
  } else {
    const lowRainDays = precip.filter((p) => p < 2).length;
    if (lowRainDays >= 7) {
      rawBreakProb = 45;
    } else {
      rawBreakProb = 20;
    }
  }

  // 3. HEAVY RAIN FLAG
  const heavyRainDates: string[] = [];
  precip.forEach((p, idx) => {
    if (p > 50 && times[idx]) {
      heavyRainDates.push(times[idx]);
    }
  });
  const heavyRainProb = heavyRainDates.length > 0 ? 85 : precip.some((p) => p > 30) ? 45 : 10;

  // 4. TELECONNECTION ADJUSTMENT
  let onsetModifier = 0;
  let breakModifier = 0;
  let teleconnectionText = "Neutral teleconnections (no adjustment)";

  if (
    climate.enso.phase.includes("La Niña") &&
    (climate.iod.phase === "Neutral" || climate.iod.phase.includes("Negative")) &&
    (climate.mjo.phase === 2 || climate.mjo.phase === 3)
  ) {
    onsetModifier = +15;
    breakModifier = -15;
    teleconnectionText = "La Niña + neutral IOD + MJO phase 2–3 active over Indian Ocean (indicative/demo value)";
  } else if (
    climate.enso.phase.includes("El Niño") &&
    climate.iod.phase.includes("Positive") &&
    (climate.mjo.phase === 6 || climate.mjo.phase === 7)
  ) {
    onsetModifier = -15;
    breakModifier = +15;
    teleconnectionText = "El Niño + positive IOD + unfavorable MJO phase 6–7 (indicative/demo value)";
  }

  const finalOnsetProb = Math.min(Math.max(rawOnsetProb + onsetModifier, 5), 95);
  const finalBreakProb = Math.min(Math.max(rawBreakProb + breakModifier, 5), 95);

  const windowDays = 14;
  const confidence: "low" | "medium" | "high" = windowDays <= 7 ? "high" : windowDays <= 14 ? "medium" : "low";

  const rationaleParts: string[] = [];
  if (onsetModifier !== 0) {
    rationaleParts.push(
      `Base onset signal ${rawOnsetProb}% → adjusted to ${finalOnsetProb}% (${teleconnectionText}).`
    );
  } else {
    rationaleParts.push(`Base onset signal ${rawOnsetProb}% based on 14-day rainfall model.`);
  }

  if (has5DayDryBreak) {
    rationaleParts.push(
      `5-day rolling dry window detected (avg rain < 1mm/day), elevating break/dry-spell risk to ${finalBreakProb}%.`
    );
  } else {
    rationaleParts.push(`Moisture continuity maintained; break risk moderate at ${finalBreakProb}%.`);
  }

  if (heavyRainDates.length > 0) {
    rationaleParts.push(`⚠️ Heavy downpour (>50mm) flagged on ${heavyRainDates.join(", ")}.`);
  }

  const dailyRainfall = times.map((dStr, idx) => {
    const d = new Date(dStr);
    return {
      date: dStr,
      dayName: idx === 0 ? "Today" : dayNamesShort[d.getDay()] || dStr,
      rain_mm: precip[idx] !== undefined ? Number(precip[idx].toFixed(1)) : 0,
      max_temp: weather.daily.maxTemp[idx] ? Math.round(weather.daily.maxTemp[idx]) : 32,
      min_temp: weather.daily.minTemp[idx] ? Math.round(weather.daily.minTemp[idx]) : 24,
      condition: weather.daily.conditions[idx] || "Clear",
      emoji: decodeWMOCode(weather.daily.conditions[idx] ? 1 : 0).emoji,
      wind_kmh: weather.daily.windSpeedMax[idx] ? Math.round(weather.daily.windSpeedMax[idx]) : 12,
    };
  });

  return {
    success: true,
    location: weather.locationName,
    country: weather.country,
    latitude: weather.latitude,
    longitude: weather.longitude,
    onset_probability_pct: finalOnsetProb,
    break_probability_pct: finalBreakProb,
    heavy_rain_probability_pct: heavyRainProb,
    heavy_rain_dates: heavyRainDates,
    confidence,
    window_days: windowDays,
    rationale: rationaleParts.join(" "),
    climate_indices: climate,
    daily_rainfall: dailyRainfall,
  };
}

// -------------------------------------------------------------
// TOOL 4: get_block_risk_grid
// -------------------------------------------------------------
export async function get_block_risk_grid(location: string): Promise<RiskGridPoint[]> {
  const outlook = await get_monsoon_outlook(location);
  const centerLat = outlook.latitude || 18.5204;
  const centerLon = outlook.longitude || 73.8567;
  const baseBreakProb = outlook.break_probability_pct || 30;
  const baseOnsetProb = outlook.onset_probability_pct || 60;
  const heavyFlag = (outlook.heavy_rain_dates || []).length > 0;

  const gridOffsets = [
    { dLat: 0.05, dLon: -0.05, name: "North-West Panchayat" },
    { dLat: 0.05, dLon: 0.0, name: "Northern Canal Zone" },
    { dLat: 0.05, dLon: 0.05, name: "North-East Hamlet" },
    { dLat: 0.0, dLon: -0.05, name: "Western Field Block" },
    { dLat: 0.0, dLon: 0.0, name: `${outlook.location.split(",")[0]} Central Block` },
    { dLat: 0.0, dLon: 0.05, name: "Eastern Mandi Sector" },
    { dLat: -0.05, dLon: -0.05, name: "South-West Watershed" },
    { dLat: -0.05, dLon: 0.0, name: "Southern Ridge Cluster" },
    { dLat: -0.05, dLon: 0.05, name: "South-East Agro Cluster" },
  ];

  const points: RiskGridPoint[] = gridOffsets.map((offset, idx) => {
    const seed = (offset.dLat * 100 + offset.dLon * 200 + idx * 7) % 13;
    const variation = Math.round(seed - 6);
    const breakPct = Math.min(Math.max(baseBreakProb + variation, 5), 95);
    const onsetPct = Math.min(Math.max(baseOnsetProb - variation, 5), 95);

    let category: "GREEN" | "YELLOW" | "ORANGE" | "RED";
    if (heavyFlag || breakPct > 75) {
      category = "RED";
    } else if (breakPct >= 50) {
      category = "ORANGE";
    } else if (breakPct >= 25) {
      category = "YELLOW";
    } else {
      category = "GREEN";
    }

    return {
      id: `pt-${idx + 1}`,
      name: offset.name,
      lat: Number((centerLat + offset.dLat).toFixed(4)),
      lon: Number((centerLon + offset.dLon).toFixed(4)),
      risk_category: category,
      onset_probability_pct: onsetPct,
      break_probability_pct: breakPct,
      heavy_rain_flag: heavyFlag && idx % 3 === 0,
      confidence: outlook.confidence || "medium",
      rationale: `Break risk ${breakPct}%, onset likelihood ${onsetPct}%.`,
    };
  });

  return points;
}

// -------------------------------------------------------------
// TOOL 5: get_crop_advisory
// -------------------------------------------------------------
export async function get_crop_advisory(
  location: string,
  crop?: string,
  growth_stage?: string
): Promise<CropAdvisoryResponse> {
  const outlook = await get_monsoon_outlook(location);
  const grid = await get_block_risk_grid(location);

  const centerPoint = grid.find((g) => g.name.includes("Central")) || grid[4] || grid[0];
  const riskCategory = centerPoint?.risk_category || "YELLOW";
  const heavyRain = (outlook.heavy_rain_dates || []).length > 0;
  const firstHeavyDate = outlook.heavy_rain_dates?.[0] || "upcoming days";

  const safeCrop = (crop || "").trim();
  const safeStage = (growth_stage || "").trim();

  if (!safeCrop || !safeStage) {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop || "Not Specified",
      growth_stage: safeStage || "Not Specified",
      risk_category: riskCategory,
      action: "Please specify your crop and growth stage.",
      details:
        "To provide a precise agronomic advisory, please select or name your crop (Paddy, Cotton, Soybean, Groundnut, Maize, or Pulses) and growth stage (Pre-sowing, Sowing, Vegetative, Flowering, or Maturity).",
      heavy_rain_flag: heavyRain,
      rule_applied: "Missing crop or growth stage input",
    };
  }

  // Decision table per specification
  if (heavyRain) {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: "RED",
      action: `Heavy downpour risk on ${firstHeavyDate} — ensure field drainage; delay any fertilizer/pesticide application until after the event.`,
      details: `Heavy rainfall (>50mm/day) can wash away top-dressed fertilizer and trigger root waterlogging in ${safeCrop}. Clear drainage channels immediately and delay chemical spraying.`,
      heavy_rain_flag: true,
      rule_applied: "Heavy-rain flag = true, any stage",
    };
  }

  if (riskCategory === "RED" && (safeStage === "Pre-sowing" || safeStage === "Sowing")) {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: "RED",
      action: "Delay sowing by 7–10 days; wait for a confirmed onset signal before committing seed.",
      details: `High dry-spell break risk (>75%) detected. Sowing now will cause germination failure or seedling scorch. Conserve seed stock until a verified wetting surge arrives.`,
      heavy_rain_flag: false,
      rule_applied: "risk=RED + stage=Pre-sowing/Sowing",
    };
  }

  if (riskCategory === "ORANGE" && safeStage === "Sowing") {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: "ORANGE",
      action: "Consider short-duration or drought-tolerant variety; stagger sowing across 2 batches to hedge against a false onset.",
      details: `Elevated break risk (50–75%) creates moisture stress vulnerability. Sow 50% acreage now with seed-treatment priming, reserving remaining seed for contingency window.`,
      heavy_rain_flag: false,
      rule_applied: "risk=ORANGE + stage=Sowing",
    };
  }

  if (
    (riskCategory === "RED" || riskCategory === "ORANGE") &&
    (safeStage === "Vegetative" || safeStage === "Flowering")
  ) {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: riskCategory,
      action: "Prepare supplemental irrigation now; this is a moisture-sensitive stage and a break phase is elevated-risk over the next 1–2 weeks.",
      details: `For ${safeCrop} at ${safeStage} stage, moisture deficits cause spikelet sterility or boll drop. Prepare farm pond/borewell irrigation and apply biomass mulching.`,
      heavy_rain_flag: false,
      rule_applied: "risk=RED/ORANGE + stage=Vegetative/Flowering",
    };
  }

  if (riskCategory === "GREEN" && (safeStage === "Pre-sowing" || safeStage === "Sowing")) {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: "GREEN",
      action: "Conditions favor onset — proceed with sowing on the standard local calendar.",
      details: `Active monsoon onset surge confirmed with low break probability (<25%). Ensure optimal seed bed preparation and timely basal fertilization.`,
      heavy_rain_flag: false,
      rule_applied: "risk=GREEN + stage=Pre-sowing/Sowing",
    };
  }

  if (riskCategory === "YELLOW") {
    return {
      success: true,
      location: outlook.location,
      crop: safeCrop,
      growth_stage: safeStage,
      risk_category: "YELLOW",
      action: "Mixed signal — monitor daily; no action needed yet, re-check in 3–4 days.",
      details: `Monsoon break risk is moderate (25–50%). Avoid rushing dry sowing or over-irrigation. Re-check the 3x3 risk grid update before making farm expenditures.`,
      heavy_rain_flag: false,
      rule_applied: "risk=YELLOW, any stage",
    };
  }

  return {
    success: true,
    location: outlook.location,
    crop: safeCrop,
    growth_stage: safeStage,
    risk_category: riskCategory,
    action: `Maintain regular intercultural operations for ${safeCrop} at ${safeStage} stage.`,
    details: `Normal monsoon conditions prevailing in ${outlook.location}. Monitor weed management and soil aeration.`,
    heavy_rain_flag: false,
    rule_applied: "Standard agronomic maintenance",
  };
}

// -------------------------------------------------------------
// GEMINI TOOL DECLARATIONS
// -------------------------------------------------------------
const getWeatherFunctionDeclaration: FunctionDeclaration = {
  name: "get_weather",
  description:
    "Fetches live weather conditions, hourly and daily forecasts, and hazard thresholds for any block, city, village, or GPS coordinates in India.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The block, village, district name or GPS coordinates.",
      },
      days: {
        type: Type.INTEGER,
        description: "Forecast duration in days (1 to 16, default 7).",
      },
    },
    required: ["location"],
  },
};

const getClimateIndicesFunctionDeclaration: FunctionDeclaration = {
  name: "get_climate_indices",
  description:
    "Returns large-scale climate teleconnection indices (ENSO ONI, IOD DMI, MJO phase and amplitude). Always label this as indicative/demo data when cited.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getMonsoonOutlookFunctionDeclaration: FunctionDeclaration = {
  name: "get_monsoon_outlook",
  description:
    "Computes rule-based monsoon onset probability, break (dry-spell) risk, heavy rain probabilities, confidence band, and rationale for a block.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The block, taluk, village, or district name in India.",
      },
    },
    required: ["location"],
  },
};

const getBlockRiskGridFunctionDeclaration: FunctionDeclaration = {
  name: "get_block_risk_grid",
  description:
    "Returns a 3x3 geospatial risk grid (~5km spacing) around the block with colored risk categories (GREEN, YELLOW, ORANGE, RED) for map rendering.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The block, village, or district name in India.",
      },
    },
    required: ["location"],
  },
};

const getCropAdvisoryFunctionDeclaration: FunctionDeclaration = {
  name: "get_crop_advisory",
  description:
    "Applies the expert agronomic decision table to produce specific localized crop advice for Paddy, Cotton, Soybean, Groundnut, Maize, or Pulses at a given growth stage.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The block or district name.",
      },
      crop: {
        type: Type.STRING,
        description: "The crop: 'Paddy', 'Cotton', 'Soybean', 'Groundnut', 'Maize', or 'Pulses'.",
      },
      growth_stage: {
        type: Type.STRING,
        description: "The growth stage: 'Pre-sowing', 'Sowing', 'Vegetative', 'Flowering', or 'Maturity'.",
      },
    },
    required: ["location"],
  },
};

const ALL_GEMINI_TOOLS = [
  {
    functionDeclarations: [
      getWeatherFunctionDeclaration,
      getClimateIndicesFunctionDeclaration,
      getMonsoonOutlookFunctionDeclaration,
      getBlockRiskGridFunctionDeclaration,
      getCropAdvisoryFunctionDeclaration,
    ],
  },
];

const KRISHI_SYSTEM_INSTRUCTION = `You are "KrishiMonsoon," an expert agro-meteorological assistant built for India's Kharif season planning.
You help farmers, agricultural extension officers, and planners understand monsoon onset timing, dry-spell (break) risk, and what to do about it for a specific crop at a specific block/village.

MANDATORY RULES:
1. NEVER invent weather numbers, rainfall figures, or probabilities. Always call the provided tool functions (get_weather, get_monsoon_outlook, get_block_risk_grid, get_crop_advisory, get_climate_indices) to get real data first.
2. DETECT THE USER'S INPUT LANGUAGE (or respect the requested language) and ALWAYS reply in that exact same language (English, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Kannada). If requested to reply in an Indian language, write 100% in that native script.
3. Every substantive answer about a location MUST be structured into these four labeled sections, in this exact order:
[Current Weather]
[Monsoon Outlook]
[Risk Map/Probabilities]
[Agronomic Advisory]
(Keep the bracket tags as shown or localize them clearly).
4. Always disclose when a figure comes from the demo climate-index mock data — append "(indicative/demo value)" or its regional translation the first time you cite ENSO/IOD/MJO.
5. Keep language plain, practical, and actionable for farmers making sowing and irrigation decisions this week.`;

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function extractLocationFromQuery(query: string): string {
  const coordMatch = query.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (coordMatch) {
    return `${coordMatch[1]}, ${coordMatch[2]}`;
  }

  // Indian Languages check
  if (query.includes("नासिक") || query.includes("नाशिक")) return "Nashik";
  if (query.includes("वर्धा")) return "Wardha";
  if (query.includes("यवतमाळ") || query.includes("यवतमाल")) return "Yavatmal";
  if (query.includes("वारंगल") || query.includes("వరంగల్")) return "Warangal";
  if (query.includes("నల్గొండ") || query.includes("नलगोंडा")) return "Nalgonda";
  if (query.includes("तஞ்சாவூர்") || query.includes("தஞ்சாவூர்") || query.includes("तंजாவூர்")) return "Thanjavur";
  if (query.includes("గుంటూరు") || query.includes("गुंटूर")) return "Guntur";
  if (query.includes("హైదరాబాద్") || query.includes("हैदराबाद")) return "Hyderabad";
  if (query.includes("नागपुर") || query.includes("नागपूर")) return "Nagpur";
  if (query.includes("पुणे") || query.includes("पुणे")) return "Pune";
  if (query.includes("चेन्नई")) return "Chennai";
  if (query.includes("दिल्ली")) return "Delhi";

  const blockMatch = query.match(/(?:in|for|at|near|around)\s+([A-Za-z\s]+?)(?:\s+(?:block|district|panchayat|village|taluk|tomorrow|next|today|\?|$))/i);
  if (blockMatch && blockMatch[1] && blockMatch[1].trim().length > 2) {
    return blockMatch[1].trim();
  }

  const directMatch = query.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (directMatch && directMatch[1]) {
    const candidate = directMatch[1].trim();
    const blacklist = ["What", "When", "Will", "Should", "Where", "How", "Break", "Monsoon", "Risk", "Kharif", "Paddy", "Cotton", "Soybean", "Groundnut", "Maize", "Pulses"];
    if (!blacklist.includes(candidate)) {
      return candidate;
    }
  }

  return "Nashik";
}

function extractCropAndStage(query: string): { crop?: string; stage?: string } {
  const q = query.toLowerCase();
  let crop: string | undefined;
  let stage: string | undefined;

  if (q.includes("paddy") || q.includes("rice") || q.includes("धान") || q.includes("వరి") || q.includes("நெல்")) crop = "Paddy";
  else if (q.includes("cotton") || q.includes("कपास") || q.includes("कापूस") || q.includes("పత్తి") || q.includes("பருத்தி")) crop = "Cotton";
  else if (q.includes("soybean") || q.includes("सोयाबीन") || q.includes("సోయాబీన్")) crop = "Soybean";
  else if (q.includes("groundnut") || q.includes("peanut") || q.includes("मूंगफली") || q.includes("వేరుశనగ")) crop = "Groundnut";
  else if (q.includes("maize") || q.includes("corn") || q.includes("मक्का") || q.includes("మొక్కజొన్న")) crop = "Maize";
  else if (q.includes("pulse") || q.includes("tur") || q.includes("urad") || q.includes("moong") || q.includes("दाल") || q.includes("పప్పు")) crop = "Pulses";

  if (q.includes("pre-sowing") || q.includes("before sowing") || q.includes("land prep") || q.includes("बुवाई पूर्व") || q.includes("पेरणीपूर्व")) stage = "Pre-sowing";
  else if (q.includes("sow") || q.includes("seeding") || q.includes("बुवाई") || q.includes("पेरणी") || q.includes("విత్తనాలు")) stage = "Sowing";
  else if (q.includes("vegetative") || q.includes("tillering") || q.includes("growth")) stage = "Vegetative";
  else if (q.includes("flower") || q.includes("blooming") || q.includes("फूल")) stage = "Flowering";
  else if (q.includes("matur") || q.includes("harvest") || q.includes("grain") || q.includes("कटाई") || q.includes("कापणी")) stage = "Maturity";

  return { crop, stage };
}

/**
 * Builds localized 4-section fallback text for any of the 8 regional languages
 */
function buildLocalizedFallback(
  lang: LanguageSpec,
  location: string,
  weather: WeatherDataResponse,
  outlook: MonsoonOutlookResponse,
  grid: RiskGridPoint[],
  crop: string,
  stage: string,
  advisory: CropAdvisoryResponse
): string {
  const greenCount = grid.filter((g) => g.risk_category === "GREEN").length;
  const breakCount = grid.filter((g) => g.risk_category === "ORANGE" || g.risk_category === "RED").length;

  if (lang.code === "hi") {
    return `[Current Weather]
📍 ${location}: तापमान ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}। हवा: ${weather.current.windspeed} किमी/घंटा।

[Monsoon Outlook]
🌧️ मानसून आगमन संभावना: ${outlook.onset_probability_pct}%
⚠️ शुष्क-दौर (Break) जोखिम: ${outlook.break_probability_pct}% (अवधि: 14 दिन)
${outlook.rationale}
*(जलवायु सूचकांक: ला-नीना ONI -0.6, IOD 0.1, MJO 3 - सांकेतिक/डेमो मान)*

[Risk Map/Probabilities]
🗺️ 3×3 ब्लॉक ग्रिड स्थिति: ${greenCount} पंचायतें अनुकूल (Green), ${breakCount} पंचायतें शुष्क जोखिम में। विश्वसनीयता: मध्यम (14-दिन)।

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "mr") {
    return `[Current Weather]
📍 ${location}: तापमान ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. वाऱ्याचा वेग: ${weather.current.windspeed} किमी/तास.

[Monsoon Outlook]
🌧️ मान्सून आगमन शक्यता: ${outlook.onset_probability_pct}%
⚠️ पावसाचा खंड (Break) धोका: ${outlook.break_probability_pct}% (कालावधी: 14 दिवस)
${outlook.rationale}
*(हवामान निर्देशांक: ला निना ONI -0.6, IOD 0.1, MJO 3 - प्रात्यक्षिक/सांकेतिक मूल्य)*

[Risk Map/Probabilities]
🗺️ 3×3 पंचायत जोखीम ग्रिड: ${greenCount} गावे/पंचायत अनुकूल (Green), ${breakCount} खंड धोक्यात. विश्वासार्हता: मध्यम.

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "te") {
    return `[Current Weather]
📍 ${location}: ఉష్ణోగ్రత ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. గాలి వేగం: ${weather.current.windspeed} కి.మీ/గం.

[Monsoon Outlook]
🌧️ రుతుపవనాల ఆగమనం సంభావ్యత: ${outlook.onset_probability_pct}%
⚠️ వర్షాభావ (Break) ముప్పు: ${outlook.break_probability_pct}% (14 రోజుల గడువు)
${outlook.rationale}
*(వాతావరణ సూచికలు: లా-నినా ONI -0.6, IOD 0.1 - డెమో విలువ)*

[Risk Map/Probabilities]
🗺️ 3×3 పంచాయతీ రిస్క్ గ్రిడ్: ${greenCount} సెక్టార్లు అనుకూలం (Green), ${breakCount} వర్షాభావ ముప్పులో ఉన్నాయి. విశ్వసనీయత: మీడియం.

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "ta") {
    return `[Current Weather]
📍 ${location}: வெப்பநிலை ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. காற்று வேகம்: ${weather.current.windspeed} கி.மீ/மணி.

[Monsoon Outlook]
🌧️ பருவமழை தொடக்க வாய்ப்பு: ${outlook.onset_probability_pct}%
⚠️ வறட்சி இடைவெளி (Break) அபாயம்: ${outlook.break_probability_pct}% (14 நாட்கள்)
${outlook.rationale}
*(காலநிலை குறியீடுகள்: லா நினா, IOD - மாதிரி மதிப்பு)*

[Risk Map/Probabilities]
🗺️ 3×3 பஞ்சாயத்து வரைபடம்: ${greenCount} பகுதிகள் சாதகமானது (Green), ${breakCount} வறட்சி அபாயத்தில் உள்ளன. நம்பிக்கை நிலை: நடுத்தரம்.

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "bn") {
    return `[Current Weather]
📍 ${location}: তাপমাত্রা ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}। বাতাসের গতি: ${weather.current.windspeed} কিমি/ঘণ্টা।

[Monsoon Outlook]
🌧️ বর্ষা আগমনের সম্ভাবনা: ${outlook.onset_probability_pct}%
⚠️ শুষ্ক বিরতি (Break) ঝুঁকি: ${outlook.break_probability_pct}% (১৪ দিন)
${outlook.rationale}
*(জলবায়ু সূচক: লা নিনা ONI -0.6, IOD 0.1 - নির্দেশক মান)*

[Risk Map/Probabilities]
🗺️ ৩×৩ পঞ্চায়েত ঝুঁকি গ্রিড: ${greenCount}টি অঞ্চল অনুকূল (Green), ${breakCount}টি শুষ্ক ঝুঁকিতে। নির্ভরযোগ্যতা: মাঝারি।

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "gu") {
    return `[Current Weather]
📍 ${location}: તાપમાન ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. પવનની ગતિ: ${weather.current.windspeed} કિમી/કલાક.

[Monsoon Outlook]
🌧️ ચોમાસા આગમનની સંભાવના: ${outlook.onset_probability_pct}%
⚠️ વરસાદી વિરામ (Break) જોખમ: ${outlook.break_probability_pct}% (૧૪ દિવસ)
${outlook.rationale}
*(વાતાવરણ સૂચકાંક: લા નીના, IOD - ડેમો મૂલ્ય)*

[Risk Map/Probabilities]
🗺️ ૩×૩ પંચાયત જોખમ ગ્રીડ: ${greenCount} વિસ્તારો અનુકૂળ (Green), ${breakCount} વિરામ જોખમમાં. વિશ્વસનીયતા: મધ્યમ.

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  if (lang.code === "kn") {
    return `[Current Weather]
📍 ${location}: ತಾಪಮಾನ ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. ಗಾಳಿಯ ವೇಗ: ${weather.current.windspeed} ಕಿ.ಮೀ/ಗಂ.

[Monsoon Outlook]
🌧️ ಮಾನ್ಸೂನ್ ಆಗಮನ ಸಂಭವನೀಯತೆ: ${outlook.onset_probability_pct}%
⚠️ ಮಳೆ ಬಿಡುವು (Break) ಅಪಾಯ: ${outlook.break_probability_pct}% (೧೪ ದಿನಗಳು)
${outlook.rationale}
*(ಹವಾಮಾನ ಸೂಚ್ಯಂಕಗಳು: ಲಾ ನಿನಾ, IOD - ಮಾದರಿ ಮೌಲ್ಯ)*

[Risk Map/Probabilities]
🗺️ ೩×೩ ಪಂಚಾಯತಿ ರಿಸ್ಕ್ ಗ್ರಿಡ್: ${greenCount} ವಲಯಗಳು ಅನುಕೂಲಕರ (Green), ${breakCount} ಬಿಡುವು ಅಪಾಯದಲ್ಲಿವೆ. ವಿಶ್ವಾಸಾರ್ಹತೆ: ಮಧ್ಯಮ.

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
  }

  // Default English
  return `[Current Weather]
📍 ${location}: ${weather.current.temperature}°C, ${weather.current.conditionText} ${weather.current.emoji}. Wind: ${weather.current.windspeed} km/h.

[Monsoon Outlook]
🌧️ Monsoon Onset Likelihood: ${outlook.onset_probability_pct}%
⚠️ Break/Dry-Spell Risk: ${outlook.break_probability_pct}% (14-day window)
${outlook.rationale}
*(Climate indices: La Niña ONI -0.6, Neutral IOD 0.1, MJO Phase 3 - indicative/demo value)*

[Risk Map/Probabilities]
🗺️ 3×3 Panchayat Risk Grid: Center block risk is ${advisory.risk_category}. ${greenCount}/9 sectors favorable (Green). Confidence: Medium (14-day window).

[Agronomic Advisory]
🌾 ${crop} (${stage}): ${advisory.action}
${advisory.details}`;
}

export async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "KrishiMonsoon", provider: "Open-Meteo + Gemini Agro-Met" });
  });

  app.get("/api/weather-data", async (req, res) => {
    const loc = (req.query.location as string) || "Nashik";
    const days = parseInt(req.query.days as string, 10) || 14;
    const result = await get_weather(loc, days);
    res.json(result);
  });

  app.get("/api/climate-indices", (_req, res) => {
    res.json(get_climate_indices());
  });

  app.get("/api/monsoon-outlook", async (req, res) => {
    const loc = (req.query.location as string) || "Nashik";
    const result = await get_monsoon_outlook(loc);
    res.json(result);
  });

  app.get("/api/risk-grid", async (req, res) => {
    const loc = (req.query.location as string) || "Nashik";
    const result = await get_block_risk_grid(loc);
    res.json(result);
  });

  app.get("/api/crop-advisory", async (req, res) => {
    const loc = (req.query.location as string) || "Nashik";
    const crop = req.query.crop as string;
    const stage = req.query.growth_stage as string;
    const result = await get_crop_advisory(loc, crop, stage);
    res.json(result);
  });

  // Chat endpoint: handles function calling, streaming SSE, and multilingual enforcement
  app.post("/api/chat", async (req, res) => {
    const {
      message,
      history = [],
      isVoice = false,
      crop: clientCrop,
      growthStage: clientStage,
      targetLang: clientLang,
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Detect language or respect manual override
    const langSpec = detectLanguage(message, clientLang);

    let weatherSummaryData: any = null;
    let computedOutlook: MonsoonOutlookResponse | null = null;
    let computedGrid: RiskGridPoint[] = [];
    let computedAdvisory: CropAdvisoryResponse | null = null;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const ai = getAIClient();

      const formattedContents: Array<{ role: "user" | "model" | "tool"; parts: any[] }> = [];

      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (h && h.text && (h.role === "user" || h.role === "model")) {
            formattedContents.push({
              role: h.role,
              parts: [{ text: h.text }],
            });
          }
        }
      }

      // Explicit instruction to enforce the detected or override language
      let augmentedPrompt = isVoice ? `[Voice Input] ${message}` : message;
      if (clientCrop || clientStage) {
        augmentedPrompt += `\n[Context: Crop=${clientCrop || "Unspecified"}, Growth Stage=${clientStage || "Unspecified"}]`;
      }
      augmentedPrompt += `\n[MANDATORY LANGUAGE: Reply ENTIRELY in ${langSpec.name} (${langSpec.scriptName}). Do NOT output in English.]`;

      formattedContents.push({
        role: "user",
        parts: [{ text: augmentedPrompt }],
      });

      const callGeminiWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> => {
        let timer: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Gemini response timeout")), timeoutMs);
        });
        try {
          return await Promise.race([promise, timeoutPromise]);
        } finally {
          if (timer) clearTimeout(timer);
        }
      };

      // 1. Initial Gemini call with all 5 tools
      const firstResponse = (await callGeminiWithTimeout(
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction: `${KRISHI_SYSTEM_INSTRUCTION}\nIMPORTANT: The user input language has been resolved to ${langSpec.name} (${langSpec.scriptName}). You MUST generate all text in ${langSpec.name}.`,
            tools: ALL_GEMINI_TOOLS,
          },
        }),
        20000
      )) as any;

      const functionCalls = firstResponse.functionCalls;
      let replyText = "";

      if (functionCalls && functionCalls.length > 0) {
        const toolResponseParts: any[] = [];
        let locationMentioned = "Nashik";

        for (const call of functionCalls) {
          const args = (call.args || {}) as any;
          if (args.location) locationMentioned = args.location;

          if (call.name === "get_weather") {
            const result = await get_weather(args.location || "Nashik", args.days || 7);
            if (result.success) {
              weatherSummaryData = {
                location: result.locationName,
                country: result.country,
                latitude: result.latitude,
                longitude: result.longitude,
                temperature: result.current.temperature,
                condition: result.current.conditionText,
                emoji: result.current.emoji,
                windSpeed: result.current.windspeed,
                precipitation: result.daily.precipitationSum[0] || 0,
                maxTemp: result.daily.maxTemp[0],
                minTemp: result.daily.minTemp[0],
                forecast14Day: result.forecast14Day,
              };
            }
            toolResponseParts.push({
              functionResponse: {
                name: "get_weather",
                response: result,
              },
            });
          } else if (call.name === "get_climate_indices") {
            const result = get_climate_indices();
            toolResponseParts.push({
              functionResponse: {
                name: "get_climate_indices",
                response: result,
              },
            });
          } else if (call.name === "get_monsoon_outlook") {
            computedOutlook = await get_monsoon_outlook(args.location || "Nashik");
            if (computedOutlook.success) {
              computedGrid = await get_block_risk_grid(args.location || "Nashik");
              weatherSummaryData = {
                location: computedOutlook.location,
                country: computedOutlook.country,
                latitude: computedOutlook.latitude,
                longitude: computedOutlook.longitude,
                temperature: computedOutlook.daily_rainfall[0]?.max_temp || 30,
                condition: computedOutlook.daily_rainfall[0]?.condition || "Partly cloudy",
                emoji: computedOutlook.daily_rainfall[0]?.emoji || "⛅",
                windSpeed: computedOutlook.daily_rainfall[0]?.wind_kmh || 12,
                precipitation: computedOutlook.daily_rainfall[0]?.rain_mm || 0,
                maxTemp: computedOutlook.daily_rainfall[0]?.max_temp,
                minTemp: computedOutlook.daily_rainfall[0]?.min_temp,
                forecast14Day: computedOutlook.daily_rainfall,
                outlook: computedOutlook,
                gridPoints: computedGrid,
              };
            }
            toolResponseParts.push({
              functionResponse: {
                name: "get_monsoon_outlook",
                response: computedOutlook,
              },
            });
          } else if (call.name === "get_block_risk_grid") {
            computedGrid = await get_block_risk_grid(args.location || "Nashik");
            toolResponseParts.push({
              functionResponse: {
                name: "get_block_risk_grid",
                response: { success: true, points: computedGrid },
              },
            });
          } else if (call.name === "get_crop_advisory") {
            const { crop, stage } = extractCropAndStage(message);
            const effCrop = args.crop || clientCrop || crop;
            const effStage = args.growth_stage || clientStage || stage;
            computedAdvisory = await get_crop_advisory(args.location || "Nashik", effCrop, effStage);
            toolResponseParts.push({
              functionResponse: {
                name: "get_crop_advisory",
                response: computedAdvisory,
              },
            });
          }
        }

        if (!computedOutlook) {
          computedOutlook = await get_monsoon_outlook(locationMentioned);
          computedGrid = await get_block_risk_grid(locationMentioned);
        }

        // Send intermediate metadata to client
        res.write(
          `data: ${JSON.stringify({
            locationSummary: weatherSummaryData,
            outlook: computedOutlook,
            gridPoints: computedGrid,
            cropAdvisory: computedAdvisory,
            detectedLanguage: langSpec.code,
          })}\n\n`
        );

        // Synthesis call with explicit language directive
        const secondResponse = (await callGeminiWithTimeout(
          ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
              ...formattedContents,
              firstResponse.candidates?.[0]?.content as any,
              {
                role: "tool",
                parts: toolResponseParts,
              },
              {
                role: "user",
                parts: [
                  {
                    text: `Now format the final answer strictly in ${langSpec.name} (${langSpec.scriptName}) using the four labeled sections: [Current Weather], [Monsoon Outlook], [Risk Map/Probabilities], and [Agronomic Advisory]. Do NOT use English text.`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: `${KRISHI_SYSTEM_INSTRUCTION}\nCRITICAL: The output MUST be in ${langSpec.name} (${langSpec.scriptName}).`,
            },
          }),
          20000
        )) as any;

        replyText = secondResponse.text || "";
      } else {
        replyText = firstResponse.text || "";
      }

      // MULTILINGUAL VERIFICATION & AUTO-TRANSLATION PASS:
      // If the target language is an Indian language and Gemini defaulted to English,
      // translate the response into the target language before rendering!
      if (langSpec.code !== "en" && langSpec.detectRegex && replyText.trim().length > 20) {
        const targetChars = (replyText.match(langSpec.detectRegex) || []).length;
        const latinChars = (replyText.match(/[a-zA-Z]/g) || []).length;

        // If predominantly in English (e.g. latin characters outnumber target script characters)
        if (targetChars < 30 && latinChars > 40) {
          console.log(`Gemini defaulted to English. Translating response into ${langSpec.name}...`);
          try {
            const translatePrompt = `You are an expert agro-meteorological translator for Indian agriculture.
Translate the following weather and advisory text completely into natural, farmer-friendly ${langSpec.name} (${langSpec.scriptName}).
RULES:
1. Maintain the four section headings:
[Current Weather]
[Monsoon Outlook]
[Risk Map/Probabilities]
[Agronomic Advisory]
2. Preserve all numbers, percentages, dates, weather emojis, and the "(indicative/demo value)" disclosure.
3. Every sentence must be in ${langSpec.name} (${langSpec.scriptName}).

Text to translate:
${replyText}`;

            const transRes = (await callGeminiWithTimeout(
              ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: [{ role: "user", parts: [{ text: translatePrompt }] }],
              }),
              12000
            )) as any;

            if (transRes?.text && transRes.text.trim().length > 20) {
              replyText = transRes.text;
            }
          } catch (transErr) {
            console.warn("Translation pass warning:", transErr);
          }
        }
      }

      // Stream generated answer in chunks
      const chunkSize = 28;
      for (let i = 0; i < replyText.length; i += chunkSize) {
        const chunk = replyText.slice(i, i + chunkSize);
        res.write(
          `data: ${JSON.stringify({
            chunk,
            locationSummary: weatherSummaryData,
            outlook: computedOutlook,
            gridPoints: computedGrid,
            cropAdvisory: computedAdvisory,
            detectedLanguage: langSpec.code,
          })}\n\n`
        );
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.warn("Gemini call error or rate limit hit, using direct Agro-Met tool fallback:", err?.message || err);

      const extractedLoc = extractLocationFromQuery(message);
      const { crop: extCrop, stage: extStage } = extractCropAndStage(message);
      const targetCrop = clientCrop || extCrop || "Paddy";
      const targetStage = clientStage || extStage || "Sowing";

      const [outlook, grid, advisory] = await Promise.all([
        get_monsoon_outlook(extractedLoc),
        get_block_risk_grid(extractedLoc),
        get_crop_advisory(extractedLoc, targetCrop, targetStage),
      ]);

      const weather = await get_weather(extractedLoc, 14);

      const locSummary = {
        location: outlook.location,
        country: outlook.country,
        latitude: outlook.latitude,
        longitude: outlook.longitude,
        temperature: weather.current.temperature,
        condition: weather.current.conditionText,
        emoji: weather.current.emoji,
        windSpeed: weather.current.windspeed,
        precipitation: weather.daily.precipitationSum[0] || 0,
        maxTemp: weather.daily.maxTemp[0],
        minTemp: weather.daily.minTemp[0],
        forecast14Day: outlook.daily_rainfall,
        outlook,
        gridPoints: grid,
      };

      const fallbackText = buildLocalizedFallback(
        langSpec,
        outlook.location,
        weather,
        outlook,
        grid,
        targetCrop,
        targetStage,
        advisory
      );

      res.write(
        `data: ${JSON.stringify({
          chunk: fallbackText,
          locationSummary: locSummary,
          outlook,
          gridPoints: grid,
          cropAdvisory: advisory,
          detectedLanguage: langSpec.code,
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`🌾 KrishiMonsoon Agro-Met engine running on port ${port}`);
  });
}

startServer();
