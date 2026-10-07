import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Wind,
  Droplets,
  ArrowUp,
  ArrowDown,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LocationSummary, DailyForecastDay } from '../types';

interface Props {
  summary: LocationSummary;
  onDismiss: () => void;
}

export const CurrentWeatherBanner: React.FC<Props> = ({ summary, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [forecastDays, setForecastDays] = useState<DailyForecastDay[]>(summary.forecast7Day || []);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Sync forecastDays when summary updates
  useEffect(() => {
    if (summary.forecast7Day && summary.forecast7Day.length > 0) {
      setForecastDays(summary.forecast7Day);
    } else {
      setForecastDays([]);
    }
  }, [summary.location, summary.forecast7Day]);

  // Fetch 7-day forecast if missing when opened
  const handleToggleExpand = async () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState && (!forecastDays || forecastDays.length < 5) && !isLoadingForecast) {
      setIsLoadingForecast(true);
      setForecastError(null);
      try {
        const res = await fetch(`/api/weather-data?location=${encodeURIComponent(summary.location)}&days=7`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.forecast7Day && data.forecast7Day.length > 0) {
          setForecastDays(data.forecast7Day);
        } else if (data.daily && data.daily.time) {
          // Fallback parsing if forecast7Day was not built
          const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const days: DailyForecastDay[] = data.daily.time.map((t: string, i: number) => {
            const d = new Date(t);
            return {
              date: t,
              dayName: i === 0 ? 'Today' : dayNamesShort[d.getDay()] || t,
              maxTemp: Math.round(data.daily.maxTemp[i] ?? summary.temperature),
              minTemp: Math.round(data.daily.minTemp[i] ?? summary.temperature - 5),
              condition: data.daily.conditions?.[i] || 'Seasonal',
              emoji: '⛅',
              precipitation: data.daily.precipitationSum?.[i] || 0,
            };
          });
          setForecastDays(days);
        }
      } catch (err: any) {
        setForecastError('Could not fetch 7-day trend. Please retry.');
      } finally {
        setIsLoadingForecast(false);
      }
    }
  };

  // Temperature calculations for the week
  const maxTemps = forecastDays.map((d) => d.maxTemp);
  const minTemps = forecastDays.map((d) => d.minTemp);
  const weekHigh = maxTemps.length > 0 ? Math.max(...maxTemps) : Math.round(summary.maxTemp ?? summary.temperature);
  const weekLow = minTemps.length > 0 ? Math.min(...minTemps) : Math.round(summary.minTemp ?? summary.temperature - 5);
  const rangeSpan = Math.max(weekHigh - weekLow, 1);

  // Identify trend direction (first 3 days vs last 3 days)
  let trendDescription = 'Stable seasonal temperatures across the week';
  let isWarming = false;
  let isCooling = false;
  if (forecastDays.length >= 5) {
    const earlyAvg = (forecastDays[0].maxTemp + forecastDays[1].maxTemp) / 2;
    const lateAvg = (forecastDays[forecastDays.length - 2].maxTemp + forecastDays[forecastDays.length - 1].maxTemp) / 2;
    const diff = lateAvg - earlyAvg;
    if (diff >= 2.5) {
      trendDescription = `Warming trend: highs rising towards ${weekHigh}°C by week's end`;
      isWarming = true;
    } else if (diff <= -2.5) {
      trendDescription = `Cooling trend: temperatures dropping down to ${weekLow}°C`;
      isCooling = true;
    } else {
      trendDescription = `Consistent temperature pattern: highs staying around ${Math.round((weekHigh + weekLow) / 2)}°C`;
    }
  }

  // Count rainy days
  const rainDays = forecastDays.filter((d) => (d.precipitation || 0) > 0.5);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white px-3.5 py-2.5 border-b border-sky-800/40 shadow-sm relative shrink-0 transition-all duration-300">
      {/* Main Banner Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Location & Condition */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-xl shrink-0 shadow-xs">
            {summary.emoji || '⛅'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-white truncate">
                {summary.location}
              </span>
              {summary.country && (
                <span className="text-[10px] text-sky-300/80 truncate hidden xs:inline">
                  , {summary.country}
                </span>
              )}
            </div>
            <div className="text-[11px] text-sky-200/90 font-medium truncate">
              {summary.condition}
            </div>
          </div>
        </div>

        {/* Temp & Metrics */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none">
              {Math.round(summary.temperature)}°C
            </div>
            {summary.maxTemp !== undefined && summary.minTemp !== undefined && (
              <div className="flex items-center justify-end gap-1 text-[10px] text-sky-300 font-mono mt-0.5">
                <span className="flex items-center">
                  <ArrowUp className="w-2.5 h-2.5 text-amber-400" />
                  {Math.round(summary.maxTemp)}°
                </span>
                <span className="flex items-center">
                  <ArrowDown className="w-2.5 h-2.5 text-cyan-400" />
                  {Math.round(summary.minTemp)}°
                </span>
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-col text-[11px] text-sky-200 border-l border-white/15 pl-2.5 space-y-0.5">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-300" />
              {Math.round(summary.windSpeed)} km/h
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-300" />
              {summary.precipitation !== undefined
                ? `${summary.precipitation} mm`
                : `${summary.humidity ?? 60}%`}
            </span>
          </div>

          <button
            onClick={onDismiss}
            title="Dismiss summary banner"
            className="p-1 rounded-md text-sky-300/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Bar with 'View 7-day Forecast' Button */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs gap-2">
        <button
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 hover:text-white border border-sky-400/25 text-[11px] font-medium transition-all active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{isExpanded ? 'Hide 7-day Forecast' : 'View 7-day Forecast'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-sky-300" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-sky-300" />
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-sky-300/90 font-mono truncate">
          <span className="text-[10px] text-sky-400/80 uppercase tracking-wider font-sans font-medium">
            7-Day Range:
          </span>
          <span className="text-cyan-300">{weekLow}°C</span>
          <span className="text-white/40">~</span>
          <span className="text-amber-300 font-semibold">{weekHigh}°C</span>
        </div>
      </div>

      {/* Expandable 7-day Temperature Trends Section */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-sky-800/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Trend Summary Headline */}
          <div className="bg-black/25 rounded-xl p-2.5 border border-white/10 flex items-start justify-between gap-2 text-xs">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-white text-[12px]">
                {isWarming ? (
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : isCooling ? (
                  <TrendingDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                )}
                <span className="truncate">Temperature Trend Outlook</span>
              </div>
              <p className="text-[11px] text-sky-200/90 leading-snug">
                {trendDescription}
              </p>
            </div>

            {rainDays.length > 0 ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 text-[10px] font-medium">
                <Droplets className="w-3 h-3 text-cyan-400" />
                {rainDays.length} {rainDays.length === 1 ? 'rain day' : 'rain days'}
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-400/30 text-amber-300 text-[10px] font-medium">
                ☀️ Dry week
              </span>
            )}
          </div>

          {isLoadingForecast && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-sky-300">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Loading 7-day temperature trends from Open-Meteo...</span>
            </div>
          )}

          {forecastError && (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-200 flex items-center justify-between">
              <span>{forecastError}</span>
              <button
                onClick={handleToggleExpand}
                className="underline text-rose-300 hover:text-white ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoadingForecast && forecastDays.length > 0 && (
            <>
              {/* SVG Trend Graph (Visual High/Low Temperature Curves) */}
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/10">
                <div className="flex items-center justify-between text-[11px] font-medium text-sky-300/90 mb-1">
                  <span>Temperature Curve (°C)</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> High
                    </span>
                    <span className="flex items-center gap-1 text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Low
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-hidden">
                  <svg
                    viewBox="0 0 320 88"
                    className="w-full h-22 select-none overflow-visible"
                  >
                    <defs>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Generate SVG points for highs and lows */}
                    {(() => {
                      const count = forecastDays.length;
                      const paddingX = 22;
                      const width = 320;
                      const plotWidth = width - paddingX * 2;
                      const minGraphTemp = weekLow - 2;
                      const maxGraphTemp = weekHigh + 2;
                      const tempDiff = Math.max(maxGraphTemp - minGraphTemp, 1);

                      const highPoints = forecastDays.map((d, i) => {
                        const x = paddingX + (i / Math.max(count - 1, 1)) * plotWidth;
                        const y = 16 + (1 - (d.maxTemp - minGraphTemp) / tempDiff) * 52;
                        return { x, y, temp: d.maxTemp, day: d.dayName, emoji: d.emoji };
                      });

                      const lowPoints = forecastDays.map((d, i) => {
                        const x = paddingX + (i / Math.max(count - 1, 1)) * plotWidth;
                        const y = 16 + (1 - (d.minTemp - minGraphTemp) / tempDiff) * 52;
                        return { x, y, temp: d.minTemp };
                      });

                      const highPoly = highPoints.map((p) => `${p.x},${p.y}`).join(' ');
                      const lowPoly = lowPoints.map((p) => `${p.x},${p.y}`).join(' ');

                      return (
                        <>
                          {/* High Line */}
                          <polyline
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={highPoly}
                          />

                          {/* Low Line */}
                          <polyline
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.2"
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={lowPoly}
                          />

                          {/* High Dots & Value Labels */}
                          {highPoints.map((p, idx) => (
                            <g key={`high-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="3.5"
                                fill="#f59e0b"
                                stroke="#0f172a"
                                strokeWidth="1.5"
                              />
                              <text
                                x={p.x}
                                y={p.y - 6}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="bold"
                                fill="#fef08a"
                                fontFamily="monospace"
                              >
                                {p.temp}°
                              </text>
                              <text
                                x={p.x}
                                y={84}
                                textAnchor="middle"
                                fontSize="8.5"
                                fill="#94a3b8"
                                fontWeight="500"
                              >
                                {p.day.slice(0, 3)}
                              </text>
                            </g>
                          ))}

                          {/* Low Dots & Value Labels */}
                          {lowPoints.map((p, idx) => (
                            <g key={`low-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="3"
                                fill="#38bdf8"
                                stroke="#0f172a"
                                strokeWidth="1.5"
                              />
                              <text
                                x={p.x}
                                y={p.y + 11}
                                textAnchor="middle"
                                fontSize="8.5"
                                fill="#bae6fd"
                                fontFamily="monospace"
                              >
                                {p.temp}°
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* 7-Day Horizontal Scroll Track of Cards */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-sky-200 flex items-center justify-between">
                  <span>Day-by-Day Forecast</span>
                  <span className="text-[10px] text-sky-400 font-normal">Scroll horizontally ➔</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                  {forecastDays.map((day, idx) => {
                    // Calculate bar position for this day relative to week high/low
                    const minPct = Math.max(
                      0,
                      Math.min(100, ((day.minTemp - weekLow) / rangeSpan) * 100)
                    );
                    const maxPct = Math.max(
                      0,
                      Math.min(100, ((day.maxTemp - weekLow) / rangeSpan) * 100)
                    );
                    const barWidth = Math.max(maxPct - minPct, 12);

                    const isToday = idx === 0;

                    return (
                      <div
                        key={day.date || idx}
                        className={`flex flex-col items-center justify-between min-w-[76px] p-2 rounded-xl text-center shrink-0 border transition-all ${
                          isToday
                            ? 'bg-sky-900/60 border-sky-400/50 ring-1 ring-sky-400/30 shadow-xs'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {/* Day & Date */}
                        <div className="w-full">
                          <div
                            className={`text-[11px] font-semibold truncate ${
                              isToday ? 'text-amber-300' : 'text-white'
                            }`}
                          >
                            {day.dayName}
                          </div>
                          <div className="text-[9px] text-sky-300/70 truncate">
                            {day.date
                              ? new Date(day.date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </div>
                        </div>

                        {/* Weather Emoji & Condition */}
                        <div className="my-1.5 flex flex-col items-center">
                          <span className="text-xl leading-none">{day.emoji || '⛅'}</span>
                          <span className="text-[9px] text-sky-200 mt-1 truncate max-w-[68px] leading-tight">
                            {day.condition}
                          </span>
                        </div>

                        {/* Temperature High / Low */}
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-300 font-bold">{day.maxTemp}°</span>
                            <span className="text-cyan-300 font-medium">{day.minTemp}°</span>
                          </div>

                          {/* Relative Week Range Bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400"
                              style={{
                                marginLeft: `${minPct}%`,
                                width: `${barWidth}%`,
                              }}
                            />
                          </div>

                          {/* Precipitation indicator */}
                          {(day.precipitation || 0) > 0 ? (
                            <div className="flex items-center justify-center gap-0.5 text-[9px] text-cyan-300 font-mono">
                              <Droplets className="w-2.5 h-2.5 text-cyan-400" />
                              <span>{day.precipitation}mm</span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-sky-400/60 font-mono">0 mm</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
