import React, { useState } from 'react';
import {
  LocationSummary,
  MonsoonOutlook,
  RiskGridPoint,
  DailyRainfallPoint,
} from '../types';
import {
  MapPin,
  Wind,
  Droplets,
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  AlertTriangle,
  CloudRain,
  Radio,
  X,
  Sparkles,
} from 'lucide-react';

interface Props {
  summary: LocationSummary;
  outlook?: MonsoonOutlook;
  gridPoints?: RiskGridPoint[];
  onDismiss: () => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
}

export const MonsoonSummaryBanner: React.FC<Props> = ({
  summary,
  outlook,
  gridPoints,
  onDismiss,
  onToggleMap,
  isMapVisible = false,
}) => {
  const [showRainfallTrend, setShowRainfallTrend] = useState(false);

  const effOutlook = outlook || summary.outlook;
  const onsetProb = effOutlook?.onset_probability_pct ?? 65;
  const breakProb = effOutlook?.break_probability_pct ?? 25;
  const heavyRainFlag = (effOutlook?.heavy_rain_dates || []).length > 0;
  const dailyRain = effOutlook?.daily_rainfall || summary.forecast14Day || [];

  return (
    <div className="bg-stone-900 border-b border-emerald-900/60 shadow-lg px-3.5 py-3 transition-all duration-300">
      {/* Top Identity & Key Metrics Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-stone-100 font-bold text-sm">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{summary.location}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Kharif 2026
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-300">
            <span className="flex items-center gap-1">
              <span className="text-base">{summary.emoji}</span>
              <span className="font-semibold text-white">{summary.temperature}°C</span>
              <span className="text-stone-400 text-[11px] truncate">({summary.condition})</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-stone-400">
              <Wind className="w-3 h-3 text-sky-400" />
              <span>{summary.windSpeed} km/h</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-stone-400">
              <Droplets className="w-3 h-3 text-teal-400" />
              <span>{summary.precipitation || 0} mm</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isMapVisible
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-stone-800 text-emerald-300 hover:bg-stone-750 border-stone-700'
              }`}
              title="Toggle 3x3 Panchayat Risk Map"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3×3 Risk Map</span>
              <span className="sm:hidden">Map</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Dismiss pinned location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monsoon Onset & Break Probabilities Pill Strip */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
        {/* Onset Probability Card */}
        <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span>Onset Likelihood</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{onsetProb}%</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-xs font-bold text-emerald-300">
            {onsetProb >= 70 ? 'High' : onsetProb >= 40 ? 'Med' : 'Low'}
          </div>
        </div>

        {/* Break Risk Probability Card */}
        <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span>Dry-Spell (Break)</span>
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                breakProb > 60 ? 'text-rose-400' : breakProb > 35 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {breakProb}%
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold ${
              breakProb > 60
                ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                : breakProb > 35
                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
            }`}
          >
            {breakProb > 60 ? 'Elevated' : breakProb > 35 ? 'Mod' : 'Low'}
          </div>
        </div>
      </div>

      {/* Teleconnection & Heavy Rain Alert Row */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-stone-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
            <Radio className="w-2.5 h-2.5 text-emerald-400" />
            <span>ENSO: La Niña (ONI -0.6)</span>
            <span className="text-[9px] text-amber-400 font-normal">(indicative)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
            <span>IOD: Neutral (0.1)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
            <span>MJO: Phase 3</span>
          </span>
        </div>

        {dailyRain.length > 0 && (
          <button
            onClick={() => setShowRainfallTrend(!showRainfallTrend)}
            className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            <span>{showRainfallTrend ? 'Hide Rainfall Trend' : '14-Day Rainfall Trend'}</span>
            {showRainfallTrend ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expandable 14-day Rainfall & Moisture Track */}
      {showRainfallTrend && dailyRain.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-stone-800 animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-200 flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-sky-400" />
              <span>14-Day Precipitation & Temperature Model (Open-Meteo)</span>
            </span>
            <span className="text-[10px] text-stone-400">
              Confidence: {effOutlook?.confidence?.toUpperCase() || 'MEDIUM'}
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {dailyRain.map((d: any, idx: number) => {
              const rain = d.rain_mm ?? d.precipitation ?? 0;
              const isHeavy = rain > 50;
              const isDry = rain < 1;

              return (
                <div
                  key={d.date || idx}
                  className={`shrink-0 w-16 p-1.5 rounded-xl border text-center flex flex-col justify-between text-[10px] transition-all ${
                    idx === 0
                      ? 'bg-emerald-950/60 border-emerald-600'
                      : isHeavy
                      ? 'bg-rose-950/40 border-rose-800'
                      : 'bg-stone-950/60 border-stone-800'
                  }`}
                >
                  <div className="font-semibold text-stone-300">{d.dayName || d.date}</div>
                  <div className="text-base my-0.5">{d.emoji || '⛅'}</div>
                  <div className="font-bold text-stone-100">{d.max_temp}°</div>
                  <div
                    className={`font-semibold mt-0.5 ${
                      isHeavy ? 'text-rose-400 font-bold' : isDry ? 'text-stone-500' : 'text-sky-400'
                    }`}
                  >
                    {rain > 0 ? `${rain}mm` : '0mm'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
