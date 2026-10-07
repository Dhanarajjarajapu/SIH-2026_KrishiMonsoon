import React, { useState } from 'react';
import {
  Sprout,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw,
  Info,
  X,
  Server,
  Radio,
  ExternalLink,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, VoiceLanguage } from '../types';

interface Props {
  selectedLang: VoiceLanguage;
  onSelectLang: (lang: VoiceLanguage) => void;
  speakReply: boolean;
  onToggleSpeakReply: () => void;
  onResetChat: () => void;
  onToggleMap?: () => void;
  isMapVisible?: boolean;
}

export const Header: React.FC<Props> = ({
  selectedLang,
  onSelectLang,
  speakReply,
  onToggleSpeakReply,
  onResetChat,
  onToggleMap,
  isMapVisible = false,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 text-stone-100 border-b border-emerald-900/50 px-3.5 py-2.5 shadow-md">
      <div className="flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-stone-950 flex items-center justify-center shadow-xs font-bold">
            <Sprout className="w-4.5 h-4.5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="text-[15px] font-bold tracking-tight text-white flex items-center gap-1">
                <span>KrishiMonsoon</span>
                <span className="text-[11px] text-amber-400 font-normal hidden sm:inline">कृषि-मानसून</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-600/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Agro-Met</span>
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5 leading-none">
              Hyperlocal Onset, Break Risk & Kharif Advisory
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Risk Map Quick Toggle */}
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className={`p-2 rounded-lg text-xs transition-colors border ${
                isMapVisible
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:text-white border-stone-700'
              }`}
              title="Toggle 3x3 Risk Map"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              id="lang-select-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-750 border border-stone-700 text-emerald-200 transition-colors"
              title="Select Input & Speech Language"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-xs">{selectedLang.name}</span>
              <span className="text-[11px] opacity-90 sm:hidden">({selectedLang.nativeName})</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-700 py-1.5 z-40 animate-in fade-in">
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Agro Advisory Languages
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    id={`lang-opt-${lang.code}`}
                    onClick={() => {
                      onSelectLang(lang);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-stone-800 transition-colors ${
                      selectedLang.code === lang.code
                        ? 'font-bold text-emerald-400 bg-emerald-950/40'
                        : 'text-stone-300'
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[11px] text-stone-400 font-normal">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speak Reply Toggle */}
          <button
            id="speak-reply-toggle-btn"
            onClick={onToggleSpeakReply}
            title={speakReply ? 'Voice Output: ON (Will speak replies)' : 'Voice Output: OFF'}
            className={`p-2 rounded-lg text-xs transition-colors border ${
              speakReply
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-750 border-stone-700'
            }`}
          >
            {speakReply ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Conversation */}
          <button
            id="reset-btn"
            onClick={onResetChat}
            title="Reset conversation"
            className="p-2 rounded-lg text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-750 border border-stone-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Scalability / Production Roadmap Modal */}
          <button
            id="info-btn"
            onClick={() => setShowInfo(true)}
            title="Production Architecture & SIH Roadmap"
            className="p-2 rounded-lg text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-750 border border-stone-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info & Scalability Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 text-stone-100 rounded-2xl max-w-md w-full p-4.5 shadow-2xl border border-stone-700 space-y-3.5 animate-in fade-in max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>KrishiMonsoon – System Architecture</span>
              </h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>KrishiMonsoon</strong> is designed as a conversational decision-support engine for Indian farmers, agricultural extension officers (AEOs/KVKs), and district planners during the high-stakes Kharif sowing and vegetative phases.
              </p>

              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2 text-[11px]">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Code-Enforced Onset & Break Logic:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-stone-300">
                  <li><strong>Onset Signal:</strong> ≥2 consecutive days with rainfall ≥15mm + 5-day sum ≥50mm.</li>
                  <li><strong>Break Signal:</strong> 5-day rolling average &lt;1mm/day triggers elevated dry-spell warning.</li>
                  <li><strong>Teleconnection Modifiers:</strong> La Niña + Neutral IOD + MJO phase 2–3 adds +15pp to onset likelihood.</li>
                  <li><strong>Heavy Rain Risk:</strong> Single-day rainfall &gt;50mm triggers drainage & spray-delay action.</li>
                </ul>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 text-emerald-100 text-[11px] space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Server className="w-3.5 h-3.5" />
                  <span>Production Roadmap (SIH Specification):</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-emerald-200/90">
                  While this prototype utilizes Open-Meteo with rule-based teleconnections, the production platform scales with:
                </p>
                <div className="text-[10px] space-y-1 text-emerald-200/80">
                  <div>• <strong>Real-time Teleconnections:</strong> NOAA CPC (ONI), BOM (IOD/MJO), and JAMSTEC feeds.</div>
                  <div>• <strong>IMD Observational Grid:</strong> 0.25° gridded daily rainfall and 700+ automatic weather stations (AWS).</div>
                  <div>• <strong>Dynamical NWP Downscaling:</strong> NCMRWF UM models downscaled via trained ML bias-correction (Random Forest & LSTM).</div>
                  <div>• <strong>GIS Spatio-Temporal Layer:</strong> India's 6,500+ blocks and 250,000+ panchayat shapefiles.</div>
                  <div>• <strong>Last-Mile Delivery:</strong> High-throughput SMS & WhatsApp Business API gateway in 8 regional languages.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
