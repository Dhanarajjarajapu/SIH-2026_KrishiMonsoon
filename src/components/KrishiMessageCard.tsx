import React, { useState } from 'react';
import { ChatMessage, ParsedKrishiSections } from '../types';
import { parseKrishiResponse } from '../utils/parser';
import { SpeechHandler } from '../utils/speech';
import {
  CloudSun,
  CloudRain,
  Compass,
  Sprout,
  AlertTriangle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Radio,
  MapPin,
} from 'lucide-react';

interface Props {
  message: ChatMessage;
  speechLangCode?: string;
  onOpenRiskMap?: () => void;
}

export const KrishiMessageCard: React.FC<Props> = ({
  message,
  speechLangCode = 'en-IN',
  onOpenRiskMap,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSpeak = () => {
    if (isSpeakingThis) {
      SpeechHandler.stopSpeaking();
      setIsSpeakingThis(false);
      return;
    }

    // Determine speech language code from message language or text detection
    const targetCode = message.language
      ? (message.language === 'hi' ? 'hi-IN' :
         message.language === 'te' ? 'te-IN' :
         message.language === 'ta' ? 'ta-IN' :
         message.language === 'bn' ? 'bn-IN' :
         message.language === 'mr' ? 'mr-IN' :
         message.language === 'gu' ? 'gu-IN' :
         message.language === 'kn' ? 'kn-IN' : speechLangCode)
      : SpeechHandler.detectLanguageFromText(message.text);

    setIsSpeakingThis(true);
    SpeechHandler.speakText(
      message.text,
      targetCode,
      () => setIsSpeakingThis(false),
      () => setIsSpeakingThis(false)
    );
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-emerald-700 text-white px-3.5 py-2.5 shadow-md">
          <p className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </p>
          {message.isVoice && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>Voice query</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message
  const parsed: ParsedKrishiSections = parseKrishiResponse(message.text);

  return (
    <div className="flex justify-start my-2.5">
      <div className="max-w-[94%] sm:max-w-[88%] w-full rounded-2xl rounded-tl-xs bg-stone-900 border border-emerald-950/90 text-stone-100 shadow-lg overflow-hidden">
        {/* Top Assistant Header & Actions */}
        <div className="bg-stone-950/60 px-3 py-1.5 border-b border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Sprout className="w-3.5 h-3.5" />
            <span>KrishiMonsoon Agro-Met Engine</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              className={`p-1 rounded-md transition-colors ${
                isSpeakingThis ? 'text-amber-400 bg-amber-950/50' : 'text-stone-400 hover:text-white'
              }`}
              title="Read aloud"
            >
              {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-stone-400 hover:text-white transition-colors"
              title="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Body: Structured 4-Section Display */}
        <div className="p-3 space-y-2.5 text-xs sm:text-[13px] leading-relaxed">
          {parsed.isStructured ? (
            <>
              {/* Section 1: Current Weather */}
              {parsed.currentWeather && (
                <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1.5 tracking-wider">
                    <CloudSun className="w-3.5 h-3.5" />
                    <span>Current Weather</span>
                  </div>
                  <div className="text-stone-200 whitespace-pre-wrap text-xs leading-normal">
                    {parsed.currentWeather}
                  </div>
                </div>
              )}

              {/* Section 2: Monsoon Outlook */}
              {parsed.monsoonOutlook && (
                <div className="p-2.5 rounded-xl bg-stone-950/50 border border-emerald-900/40 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5 tracking-wider">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Monsoon Outlook</span>
                  </div>
                  <div className="text-stone-200 whitespace-pre-wrap text-xs leading-normal">
                    {parsed.monsoonOutlook}
                  </div>
                </div>
              )}

              {/* Section 3: Risk Map / Probabilities */}
              {parsed.riskMap && (
                <div className="p-2.5 rounded-xl bg-stone-950/50 border border-amber-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5 tracking-wider">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Risk Map & Probabilities</span>
                    </div>

                    {onOpenRiskMap && (
                      <button
                        onClick={onOpenRiskMap}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-amber-300 text-[10px] font-semibold border border-stone-700 transition-colors"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Inspect 3×3 Grid</span>
                      </button>
                    )}
                  </div>
                  <div className="text-stone-200 whitespace-pre-wrap text-xs leading-normal">
                    {parsed.riskMap}
                  </div>
                </div>
              )}

              {/* Section 4: Agronomic Advisory */}
              {parsed.agronomicAdvisory && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1.5 tracking-wider">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Agronomic Advisory</span>
                  </div>
                  <div className="text-stone-100 whitespace-pre-wrap text-xs leading-normal font-medium">
                    {parsed.agronomicAdvisory}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Fallback plain formatting
            <div className="text-stone-200 whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-[13px]">
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
