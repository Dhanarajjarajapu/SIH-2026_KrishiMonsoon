import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Snowflake,
  Wind,
  CloudRain,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Mic,
  Bot,
  Compass,
} from 'lucide-react';
import { ChatMessage, WeatherAlert } from '../types';
import { SpeechHandler } from '../utils/speech';

interface Props {
  message: ChatMessage;
  speechLangCode?: string;
}

export const WeatherMessageCard: React.FC<Props> = ({
  message,
  speechLangCode = 'auto',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (message.role === 'user') {
    return (
      <div id={`msg-${message.id}`} className="flex justify-end my-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-teal-900 to-slate-900 text-white px-4 py-2.5 shadow-sm border border-teal-700/30">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-teal-300">
            {message.isVoice && (
              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">
                <Mic className="w-3 h-3" /> Voice
              </span>
            )}
            <span>You</span>
          </div>
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechHandler.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      SpeechHandler.speakText(message.text, speechLangCode, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const alerts = message.alerts || [];
  const hasSevereAlert = alerts.some((a) => a.severity === 'warning');
  const hasAdvisory = alerts.some((a) => a.severity === 'advisory');

  const getAlertIcon = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'heavy_rain':
        return <CloudRain className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'high_wind':
        return <Wind className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'heatwave':
        return <Flame className="w-4 h-4 text-red-500 shrink-0" />;
      case 'cold_wave':
        return <Snowflake className="w-4 h-4 text-cyan-500 shrink-0" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  return (
    <div id={`msg-${message.id}`} className="my-2.5 max-w-[96%] sm:max-w-[88%]">
      <div
        className={`rounded-2xl rounded-tl-sm bg-white text-neutral-900 border shadow-xs overflow-hidden transition-all ${
          hasSevereAlert
            ? 'border-rose-400/80 ring-2 ring-rose-500/20 shadow-rose-100'
            : hasAdvisory
            ? 'border-amber-400/80 ring-1 ring-amber-500/20'
            : 'border-slate-200'
        }`}
      >
        {/* Render Alert Banner when threshold is crossed */}
        {alerts.length > 0 && (
          <div
            className={`px-3.5 py-2 border-b flex flex-col gap-1.5 ${
              hasSevereAlert
                ? 'bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-rose-200 text-rose-950'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-950'
            }`}
          >
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      {alert.title}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/80 border border-rose-200 text-rose-900">
                      Value: {alert.value} (Limit: {alert.threshold})
                    </span>
                  </div>
                  {alert.advisoryText && (
                    <div className="text-[11px] font-medium text-neutral-800 mt-0.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{alert.advisoryText}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card Header with Bot identity and Controls */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <div className="w-5 h-5 rounded-md bg-teal-700 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-3 h-3" />
            </div>
            <span>WeatherGPT</span>
            {message.locationSummary && (
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {message.locationSummary.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              id={`speak-btn-${message.id}`}
              onClick={handleToggleSpeak}
              title={isSpeaking ? 'Stop speaking' : 'Listen aloud'}
              className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                isSpeaking
                  ? 'bg-sky-100 text-sky-800 font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Speak</span>
                </>
              )}
            </button>
            <button
              id={`copy-btn-${message.id}`}
              onClick={handleCopy}
              title="Copy answer"
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card Body with Meteorological Answer */}
        <div className="p-3.5 text-[14px] leading-relaxed text-slate-900 whitespace-pre-wrap break-words">
          {message.text}
        </div>

        {/* Footer timestamp & grounding badge */}
        <div className="px-3.5 py-1.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
            Open-Meteo Verified
          </span>
        </div>
      </div>
    </div>
  );
};
