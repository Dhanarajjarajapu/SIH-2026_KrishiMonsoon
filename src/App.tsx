import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomControlBar } from './components/BottomControlBar';
import { KrishiMessageCard } from './components/KrishiMessageCard';
import { MonsoonSummaryBanner } from './components/MonsoonSummaryBanner';
import { RiskMapPanel } from './components/RiskMapPanel';
import { CropSelector } from './components/CropSelector';
import {
  ChatMessage,
  LocationSummary,
  MonsoonOutlook,
  RiskGridPoint,
  CropType,
  GrowthStage,
  CropAdvisory,
  SUPPORTED_LANGUAGES,
  VoiceLanguage,
} from './types';
import {
  Sprout,
  Compass,
  CloudRain,
  ShieldAlert,
  Languages,
  TrendingUp,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react';
import { SpeechHandler } from './utils/speech';

const STORAGE_KEY = 'krishimonsoon_chat_history_v1';
const LANG_STORAGE_KEY = 'krishimonsoon_user_lang_v1';
const PINNED_STORAGE_KEY = 'krishimonsoon_pinned_loc_v1';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) {
        const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
        if (found) return found;
      }
    } catch (_) {}
    return SUPPORTED_LANGUAGES[0]; // Auto-Detect
  });

  const [pinnedLocation, setPinnedLocation] = useState<LocationSummary | null>(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });

  const [monsoonOutlook, setMonsoonOutlook] = useState<MonsoonOutlook | null>(null);
  const [gridPoints, setGridPoints] = useState<RiskGridPoint[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('Paddy');
  const [selectedStage, setSelectedStage] = useState<GrowthStage>('Sowing');
  const [activeAdvisory, setActiveAdvisory] = useState<CropAdvisory | null>(null);

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [speakReply, setSpeakReply] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Save messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  // Save selected language
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, selectedLang.code);
    } catch (_) {}
  }, [selectedLang]);

  // Save pinned location
  useEffect(() => {
    try {
      if (pinnedLocation) {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedLocation));
      } else {
        localStorage.removeItem(PINNED_STORAGE_KEY);
      }
    } catch (_) {}
  }, [pinnedLocation]);

  // Auto-scroll chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, isLoading]);

  const handleResetChat = () => {
    if (window.confirm('Clear conversation history and reset location?')) {
      SpeechHandler.stopSpeaking();
      setMessages([]);
      setStreamingMessage(null);
      setPinnedLocation(null);
      setMonsoonOutlook(null);
      setGridPoints([]);
      setActiveAdvisory(null);
      setIsMapVisible(false);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PINNED_STORAGE_KEY);
    }
  };

  const handleSendMessage = async (text: string, isVoice = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      isVoice,
      timestamp: Date.now(),
      crop: selectedCrop,
      growthStage: selectedStage,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    const initialStreaming: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
    };
    setStreamingMessage(initialStreaming);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          isVoice,
          crop: selectedCrop,
          growthStage: selectedStage,
          targetLang: selectedLang.code,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let receivedOutlook: MonsoonOutlook | null = null;
      let receivedGrid: RiskGridPoint[] = [];
      let receivedAdvisory: CropAdvisory | null = null;
      let receivedLocation: LocationSummary | null = null;
      let receivedLang: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const lines = rawChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.chunk) {
                accumulatedText += data.chunk;
              }
              if (data.detectedLanguage) {
                receivedLang = data.detectedLanguage;
              }
              if (data.outlook) {
                receivedOutlook = data.outlook;
                setMonsoonOutlook(data.outlook);
                setIsMapVisible(true);
              }
              if (data.gridPoints && Array.isArray(data.gridPoints)) {
                receivedGrid = data.gridPoints;
                setGridPoints(data.gridPoints);
              }
              if (data.cropAdvisory) {
                receivedAdvisory = data.cropAdvisory;
                setActiveAdvisory(data.cropAdvisory);
              }
              if (data.locationSummary) {
                receivedLocation = data.locationSummary;
                setPinnedLocation(data.locationSummary);
              }

              setStreamingMessage({
                ...initialStreaming,
                text: accumulatedText,
                outlook: receivedOutlook || undefined,
                gridPoints: receivedGrid.length > 0 ? receivedGrid : undefined,
                cropAdvisory: receivedAdvisory || undefined,
                locationSummary: receivedLocation || undefined,
                language: receivedLang || selectedLang.code,
              });
            } catch (_) {}
          }
        }
      }

      const finalMsg: ChatMessage = {
        ...initialStreaming,
        text: accumulatedText || 'Monsoon outlook and crop advisory processed.',
        outlook: receivedOutlook || monsoonOutlook || undefined,
        gridPoints: receivedGrid.length > 0 ? receivedGrid : gridPoints.length > 0 ? gridPoints : undefined,
        cropAdvisory: receivedAdvisory || activeAdvisory || undefined,
        locationSummary: receivedLocation || pinnedLocation || undefined,
        language: receivedLang || selectedLang.code,
      };

      setMessages((prev) => [...prev, finalMsg]);
      setStreamingMessage(null);

      // Read aloud if toggle is on or voice input was used
      if (speakReply || isVoice) {
        const speechCode =
          receivedLang && receivedLang !== 'auto'
            ? SUPPORTED_LANGUAGES.find((l) => l.code === receivedLang)?.speechCode ||
              SpeechHandler.detectLanguageFromText(finalMsg.text)
            : selectedLang.code !== 'auto'
            ? selectedLang.speechCode
            : SpeechHandler.detectLanguageFromText(finalMsg.text);

        SpeechHandler.speakText(finalMsg.text, speechCode);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `[Current Weather]
⚠️ Agro-meteorological radar busy.

[Monsoon Outlook]
Service temporarily experiencing network congestion.

[Risk Map/Probabilities]
⚠️ ${err?.message || 'Connection timeout'}

[Agronomic Advisory]
Please retry your query or tap a quick-reply chip to reload live Open-Meteo observations.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStreamingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerCropAdvisory = (crop: CropType, stage: GrowthStage) => {
    const locName = pinnedLocation?.location || monsoonOutlook?.location || 'Nashik';
    const query = `What is the specific agronomic advisory for ${crop} at ${stage} stage in ${locName} considering current onset and break probability?`;
    handleSendMessage(query, false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex justify-center items-center p-0 sm:p-4">
      {/* Responsive Main Frame */}
      <div className="w-full sm:max-w-2xl lg:max-w-4xl h-[100dvh] sm:h-[94vh] sm:rounded-3xl bg-stone-900 sm:border sm:border-stone-800 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <Header
          selectedLang={selectedLang}
          onSelectLang={setSelectedLang}
          speakReply={speakReply}
          onToggleSpeakReply={() => setSpeakReply(!speakReply)}
          onResetChat={handleResetChat}
          onToggleMap={() => setIsMapVisible(!isMapVisible)}
          isMapVisible={isMapVisible}
        />

        {/* Pinned Agro-Met Banner if location discussed */}
        {pinnedLocation && (
          <MonsoonSummaryBanner
            summary={pinnedLocation}
            outlook={monsoonOutlook || undefined}
            gridPoints={gridPoints}
            onDismiss={() => {
              setPinnedLocation(null);
              setIsMapVisible(false);
            }}
            onToggleMap={() => setIsMapVisible(!isMapVisible)}
            isMapVisible={isMapVisible}
          />
        )}

        {/* Collapsible / Expandable Risk Map Panel */}
        {isMapVisible && (pinnedLocation || monsoonOutlook) && (
          <div className="p-2 sm:p-3 bg-stone-950 border-b border-stone-800 animate-in slide-in-from-top-3 duration-200">
            <RiskMapPanel
              gridPoints={
                gridPoints.length > 0
                  ? gridPoints
                  : [
                      {
                        id: 'pt-1',
                        name: `${(pinnedLocation?.location || 'Block').split(',')[0]} Central`,
                        lat: pinnedLocation?.latitude || 18.52,
                        lon: pinnedLocation?.longitude || 73.85,
                        risk_category: 'GREEN',
                        onset_probability_pct: 75,
                        break_probability_pct: 18,
                        heavy_rain_flag: false,
                        confidence: 'medium',
                      },
                    ]
              }
              center={{
                lat: pinnedLocation?.latitude || monsoonOutlook?.latitude || 18.52,
                lon: pinnedLocation?.longitude || monsoonOutlook?.longitude || 73.85,
                location: pinnedLocation?.location || monsoonOutlook?.location || 'Block',
              }}
              isExpanded={isMapExpanded}
              onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
              onClose={() => setIsMapVisible(false)}
            />
          </div>
        )}

        {/* Crop Selector Bar when location is active */}
        {(pinnedLocation || monsoonOutlook) && (
          <div className="px-3 pt-2 bg-stone-900">
            <CropSelector
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              selectedStage={selectedStage}
              onSelectStage={setSelectedStage}
              onTriggerAdvisory={handleTriggerCropAdvisory}
              activeAdvisory={activeAdvisory}
              locationName={pinnedLocation?.location || monsoonOutlook?.location || 'Active Block'}
            />
          </div>
        )}

        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 scroll-smooth no-scrollbar"
        >
          {messages.length === 0 && !streamingMessage ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xs">
                <Sprout className="w-7 h-7 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-1.5">
                  <span>Welcome to KrishiMonsoon</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Kharif 2026
                  </span>
                </h2>
                <p className="text-xs text-stone-400 mt-1 max-w-[340px] mx-auto leading-relaxed">
                  Hyperlocal monsoon onset & dry-spell break prediction with verified agronomic decision-support for Indian farmers, extension officers & agri-planners.
                </p>
              </div>

              {/* 4 Core Pillars of KrishiMonsoon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[480px] text-left text-xs">
                <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Onset Signal Rule</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    ≥2 days rain ≥15mm + 5-day sum ≥50mm triggers confirmed onset signal.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Dry-Spell (Break) Logic</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    5-day rolling average &lt;1mm/day flags moisture stress & sowing risk.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                    <Compass className="w-3.5 h-3.5" />
                    <span>3×3 Panchayat Risk Grid</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Interactive Leaflet map with 5km spatial grid cells (Green/Yellow/Orange/Red).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-400">
                    <Languages className="w-3.5 h-3.5" />
                    <span>8 Indian Languages + Voice</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    English, हिन्दी, తెలుగు, தமிழ், বাংলা, मराठी, ગુજરાતી, ಕನ್ನಡ.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Tap a demo chip below, tap GPS, or speak via microphone</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <KrishiMessageCard
                  key={msg.id}
                  message={msg}
                  speechLangCode={selectedLang.speechCode}
                  onOpenRiskMap={() => setIsMapVisible(true)}
                />
              ))}

              {/* Streaming / In-Flight Message */}
              {streamingMessage && (
                <div className="animate-in fade-in duration-200">
                  {streamingMessage.text ? (
                    <KrishiMessageCard
                      message={streamingMessage}
                      speechLangCode={selectedLang.speechCode}
                      onOpenRiskMap={() => setIsMapVisible(true)}
                    />
                  ) : (
                    <div className="my-2 max-w-[85%] rounded-2xl bg-stone-950 border border-emerald-800/80 p-3 shadow-md">
                      <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                        <span>Evaluating Open-Meteo rainfall models & agro-teleconnections...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <BottomControlBar
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedLang={selectedLang}
        />
      </div>
    </div>
  );
}
