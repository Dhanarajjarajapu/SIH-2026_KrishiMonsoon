// Utility for Web Speech API (Recognition and Synthesis)
// Enhanced for regional Indian language dialects and segmented audio delivery

export class SpeechHandler {
  private static recognition: any = null;
  private static speechSessionId = 0;
  private static isSpeakingFlag = false;

  /**
   * Detects the language from text content and returns the exact BCP-47 speech code:
   * hi-IN, te-IN, ta-IN, bn-IN, mr-IN, gu-IN, kn-IN, en-IN
   */
  public static detectLanguageFromText(text: string): string {
    if (!text) return 'en-IN';

    // 1. Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';

    // 2. Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';

    // 3. Bengali
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';

    // 4. Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN';

    // 5. Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';

    // 6. Devanagari script: Differentiate Marathi vs Hindi
    if (/[\u0900-\u097F]/.test(text)) {
      // Check for Marathi-specific letter ळ or distinctive Marathi vocabulary
      if (
        text.includes('ळ') ||
        /\b(आहे|नाही|शेतकरी|पाहिजे|पाऊस|हवामान|कधी|येणार|काय|पीक|जमीन|सल्ला|पेरणी|अवकाळी|अंदाज)\b/i.test(
          text
        )
      ) {
        return 'mr-IN';
      }
      return 'hi-IN';
    }

    return 'en-IN';
  }

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Starts speech recognition in the designated regional language
   */
  public static startListening(
    langCode: string,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): () => void {
    if (!this.isRecognitionSupported()) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return () => {};
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recog = new SpeechRecognitionClass();
    recog.lang = langCode === 'auto' ? 'en-IN' : (langCode || 'en-IN');
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onResult(final || interim, !!final);
    };

    recog.onerror = (e: any) => {
      onError(e);
    };

    recog.onend = () => {
      onEnd();
    };

    try {
      recog.start();
      this.recognition = recog;
    } catch (err) {
      onError(err);
    }

    return () => {
      try {
        recog.stop();
      } catch (_) {}
    };
  }

  public static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
  }

  /**
   * Splits text into short, natural segments for clearer speech synthesis delivery
   */
  public static splitIntoShortUtterances(text: string, langCode: string): string[] {
    if (!text) return [];

    // Replace structured section tags with natural speech pauses/intros
    let cleaned = text
      .replace(/\[Current Weather\]/gi, langCode.startsWith('hi') ? 'वर्तमान मौसम.' : langCode.startsWith('te') ? 'ప్రస్తుత వాతావరణం.' : langCode.startsWith('ta') ? 'தற்போதைய வானிலை.' : langCode.startsWith('mr') ? 'सध्याचे हवामान.' : 'Current weather.')
      .replace(/\[Monsoon Outlook\]/gi, langCode.startsWith('hi') ? 'मानसून परिदृश्य.' : langCode.startsWith('te') ? 'రుతుపవనాల సూచన.' : langCode.startsWith('ta') ? 'பருவமழை முன்னறிவிப்பு.' : langCode.startsWith('mr') ? 'पावसाचा अंदाज.' : 'Monsoon outlook.')
      .replace(/\[Risk Map\/Probabilities\]/gi, langCode.startsWith('hi') ? 'जोखिम मानचित्र और संभावनाएं.' : langCode.startsWith('te') ? 'రిస్క్ మ్యాప్ మరియు సంభావ్యత.' : langCode.startsWith('ta') ? 'அபாய வரைபடம்.' : langCode.startsWith('mr') ? 'धोका नकाशा.' : 'Risk map and probabilities.')
      .replace(/\[Agronomic Advisory\]/gi, langCode.startsWith('hi') ? 'कृषि सलाह.' : langCode.startsWith('te') ? 'వ్యవసాయ సలహా.' : langCode.startsWith('ta') ? 'விவசாய ஆலோசனை.' : langCode.startsWith('mr') ? 'कृषी सल्ला.' : 'Agronomic advisory.')
      .replace(/\[Forecast\]/gi, 'Forecast.')
      .replace(/\[Alerts\/Warnings\]/gi, 'Alerts.')
      .replace(/[*_#`~>]/g, ' ')
      .replace(/\(indicative\/demo value\)/gi, 'indicative value')
      .replace(/\(सांकेतिक\/डेमो मान\)/gi, 'सांकेतिक मान')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[•-]\s+/g, '')
      .trim();

    // Split on major punctuation (sentence enders, devanagari purna viram, question marks, newlines)
    // Avoiding splitting numbers like 15.5mm
    const rawSegments = cleaned.split(/(?<=[^\d]\.)\s+|(?<=\d\.\s+)|\n+|[?!।;]+|\s*\|\s*/);

    const result: string[] = [];

    for (const seg of rawSegments) {
      const trimmed = seg.trim();
      if (!trimmed || trimmed.length < 2) continue;

      // If a segment is longer than ~90 characters, break it further on commas or conjunctions
      if (trimmed.length > 95) {
        const subChunks = trimmed.split(/,\s+|—|\s+(?:and|or|और|तथा|व|तसेच|आणि|మరియు|மற்றும்)\s+/i);
        for (const sub of subChunks) {
          const subTrimmed = sub.trim();
          if (subTrimmed.length > 1) {
            result.push(subTrimmed);
          }
        }
      } else {
        result.push(trimmed);
      }
    }

    return result.length > 0 ? result : [cleaned];
  }

  /**
   * Speaks text using SpeechSynthesis with:
   * 1. Exact BCP-47 regional code: hi-IN, te-IN, ta-IN, bn-IN, mr-IN, gu-IN, kn-IN, en-IN
   * 2. Sentence chunking into short sequential utterances for clear audio delivery
   */
  public static speakText(
    text: string,
    langSpeechCode?: string,
    onFinish?: () => void,
    onError?: (err: any) => void
  ): () => void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return () => {};
    }

    // Cancel ongoing speech & increment session ID to cancel existing queued timers
    window.speechSynthesis.cancel();
    const sessionId = ++this.speechSessionId;
    this.isSpeakingFlag = true;

    const targetLang =
      !langSpeechCode || langSpeechCode === 'auto'
        ? this.detectLanguageFromText(text)
        : langSpeechCode;

    // Break text into short natural utterances
    const utterances = this.splitIntoShortUtterances(text, targetLang);

    if (utterances.length === 0) {
      this.isSpeakingFlag = false;
      if (onFinish) onFinish();
      return () => {};
    }

    // Try finding an installed voice matching targetLang
    let matchingVoice: SpeechSynthesisVoice | null = null;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      matchingVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase() === targetLang.toLowerCase() ||
            v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase()
        ) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())) ||
        null;
    }

    let currentIndex = 0;

    const playNext = () => {
      // If session was cancelled
      if (sessionId !== this.speechSessionId) {
        return;
      }

      if (currentIndex >= utterances.length) {
        this.isSpeakingFlag = false;
        if (onFinish) onFinish();
        return;
      }

      const phrase = utterances[currentIndex];
      currentIndex++;

      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = targetLang;
      if (matchingVoice) {
        u.voice = matchingVoice;
      }
      u.rate = 0.95; // Clear natural pacing for farmers
      u.pitch = 1.0;

      u.onend = () => {
        if (sessionId === this.speechSessionId) {
          // Slight 100ms pause between sentences for crystal clear audio
          setTimeout(playNext, 100);
        }
      };

      u.onerror = (e) => {
        // If aborted intentionally by cancel, do not treat as error
        if (sessionId !== this.speechSessionId) return;

        if (currentIndex < utterances.length) {
          setTimeout(playNext, 100);
        } else {
          this.isSpeakingFlag = false;
          if (onError) onError(e);
          else if (onFinish) onFinish();
        }
      };

      window.speechSynthesis.speak(u);
    };

    playNext();

    return () => {
      this.stopSpeaking();
    };
  }

  public static stopSpeaking() {
    this.speechSessionId++;
    this.isSpeakingFlag = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public static isSpeaking(): boolean {
    return this.isSpeakingFlag;
  }
}
