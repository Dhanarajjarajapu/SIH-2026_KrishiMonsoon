import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  LocateFixed,
  AlertCircle,
} from 'lucide-react';
import { VoiceLanguage } from '../types';
import { SpeechHandler } from '../utils/speech';

interface Props {
  onSendMessage: (text: string, isVoice?: boolean) => void;
  isLoading: boolean;
  selectedLang: VoiceLanguage;
}

export const BottomControlBar: React.FC<Props> = ({
  onSendMessage,
  isLoading,
  selectedLang,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick-reply demo chips tailored for KrishiMonsoon
  const demoChips = [
    { label: '🌧️ Monsoon outlook for Nashik block', query: 'What is the monsoon onset and break risk outlook for Nashik block for the next 14 days?' },
    { label: '🌾 Should I sow paddy now in Warangal?', query: 'Should I sow paddy now in Warangal? What is the onset and break probability for pre-sowing?' },
    { label: '📅 वर्धा में मानसून कब आएगा?', query: 'वर्धा (Wardha) में मानसून कब तक आएगा? सोयाबीन बुवाई के लिए मौसम अनुकूल है क्या?' },
    { label: '☁️ Break risk for cotton in Yavatmal next 2 weeks', query: 'What is the break dry-spell risk for cotton in Yavatmal block over the next 2 weeks?' },
    { label: '🌱 నల్గొండలో పత్తి విత్తనాలు ఎప్పుడు వేయాలి?', query: 'నల్గొండ జిల్లాలో పత్తి విత్తనాలు వేయడానికి వర్ష సూచన మరియు ఆగమనం ఎలా ఉంది?' },
    { label: '🌾 தஞ்சாவூரில் நெல் விதைப்பு ஆலோசனை', query: 'தஞ்சாவூர் பகுதியில் குறுவை நெல் விதைப்புக்கு பருவமழை மற்றும் உலர் கால அபாயம் என்ன?' },
    { label: '🌾 বোরো ধানের জন্য বাঁকুড়ায় বর্ষা কেমন?', query: 'বাঁকুড়া জেলায় আমন ও বোরো ধানের জন্য বর্ষার আগমন এবং খরার ঝুঁকি কেমন?' },
    { label: '🌱 પાટણ જિલ્લામાં કપાસ વાવણી સલાહ', query: 'પાટણ જિલ્લામાં કપાસ વાવણી માટે ચોમાસાનું આગમન અને વરસાદી વિરામ જોખમ શું છે?' },
  ];

  const handleSend = (textToSend?: string, isVoice = false) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    onSendMessage(text, isVoice);
    setInput('');
    setVoiceTranscript('');
    setLocationStatus(null);
    if (isListening) {
      SpeechHandler.stopListening();
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input using Web Speech API -> auto-send on final segment
  const toggleVoiceInput = () => {
    if (isListening) {
      SpeechHandler.stopListening();
      setIsListening(false);
      if (voiceTranscript.trim()) {
        handleSend(voiceTranscript, true);
      }
      return;
    }

    if (!SpeechHandler.isRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setIsListening(true);
    setVoiceTranscript('');

    SpeechHandler.startListening(
      selectedLang.speechCode,
      (transcript, isFinal) => {
        setVoiceTranscript(transcript);
        setInput(transcript);

        if (isFinal && transcript.trim()) {
          setTimeout(() => {
            handleSend(transcript, true);
          }, 350);
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Browser Geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('GPS not supported in browser');
      setTimeout(() => setLocationStatus(null), 3000);
      return;
    }

    setIsLocating(true);
    setLocationStatus('Pinpointing farm coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        setIsLocating(false);
        setLocationStatus(`GPS: ${lat}°N, ${lon}°E`);

        let locQuery = `What is the monsoon onset and break risk for my current farm location (${lat}, ${lon})?`;
        if (selectedLang.code === 'hi') {
          locQuery = `मेरे वर्तमान खेत स्थान (${lat}, ${lon}) के लिए मानसून आगमन और शुष्क-दौर जोखिम क्या है?`;
        } else if (selectedLang.code === 'te') {
          locQuery = `నా ప్రస్తుత వ్యవసాయ ప్రాంతం (${lat}, ${lon}) కోసం రుతుపవనాల ఆగమనం మరియు వర్షాభావ ముప్పు ఎలా ఉంది?`;
        } else if (selectedLang.code === 'mr') {
          locQuery = `माझ्या शेताच्या सध्याच्या स्थानासाठी (${lat}, ${lon}) मान्सून आगमन आणि पावसाचा खंड काय आहे?`;
        } else if (selectedLang.code === 'ta') {
          locQuery = `எனது தற்போதைய பண்ணை இருப்பிடத்திற்கு (${lat}, ${lon}) பருவமழை தொடக்கம் மற்றும் வறட்சி அபாயம் என்ன?`;
        }
        handleSend(locQuery, false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not access GPS';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow GPS access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out';
        }
        setLocationStatus(msg);
        setTimeout(() => setLocationStatus(null), 3500);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    return () => {
      if (isListening) {
        SpeechHandler.stopListening();
      }
    };
  }, [isListening]);

  return (
    <div className="bg-stone-950 border-t border-stone-800/90 p-2.5 sm:p-3 space-y-2 z-10">
      {/* Quick-Reply Chips Carousel */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        {demoChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-emerald-300 border border-stone-800 hover:border-emerald-700/60 text-[11px] transition-all whitespace-nowrap disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Status notification if GPS / speech error */}
      {locationStatus && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 border border-emerald-900/60 rounded-xl text-[11px] text-emerald-300 animate-in fade-in">
          {isLocating ? (
            <Loader2 className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{locationStatus}</span>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="flex items-center gap-1.5">
        {/* GPS Geolocation Button */}
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLoading || isLocating}
          title="Get current farm GPS coordinates"
          className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-emerald-400 transition-colors disabled:opacity-50 shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <LocateFixed className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isListening
                ? `Listening (${selectedLang.nativeName})...`
                : selectedLang.code === 'hi'
                ? 'मानसून आगमन, शुष्क-दौर या फसल सलाह पूछें...'
                : selectedLang.code === 'te'
                ? 'రుతుపవనాల సూచన లేదా పంట సలహా అడగండి...'
                : selectedLang.code === 'mr'
                ? 'पावसाचा अंदाज, खंड किंवा पीक सल्ला विचारा...'
                : selectedLang.code === 'ta'
                ? 'பருவமழை அல்லது பயிர் ஆலோசனை கேளுங்கள்...'
                : 'Ask about onset, break risk, or crop advisory...'
            }
            className="w-full bg-stone-900 text-stone-100 placeholder-stone-500 border border-stone-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden transition-colors"
          />
        </div>

        {/* Microphone Button with regional language badge */}
        <button
          onClick={toggleVoiceInput}
          disabled={isLoading}
          title={isListening ? 'Stop listening' : `Speak in ${selectedLang.name} (${selectedLang.speechCode})`}
          className={`p-2.5 rounded-xl transition-all shrink-0 relative ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-900/50'
              : 'bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-400" />}
          {selectedLang.code !== 'auto' && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center font-bold text-stone-950">
              {selectedLang.code.slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-white disabled:text-stone-600 transition-colors shrink-0 shadow-xs"
          title="Send query"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
