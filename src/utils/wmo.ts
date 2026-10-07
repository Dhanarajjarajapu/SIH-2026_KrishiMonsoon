export interface WMODescription {
  condition: string;
  emoji: string;
  hindi: string;
  telugu: string;
}

export const WMO_CODES: Record<number, WMODescription> = {
  0: { condition: 'Clear sky', emoji: '☀️', hindi: 'साफ आसमान', telugu: 'నిర్మలమైన ఆకాశం' },
  1: { condition: 'Mainly clear', emoji: '🌤️', hindi: 'मुख्य रूप से साफ', telugu: 'ఎక్కువగా నిర్మలం' },
  2: { condition: 'Partly cloudy', emoji: '⛅', hindi: 'आंशिक बादल', telugu: 'పాక్షికంగా మేఘావృతం' },
  3: { condition: 'Overcast', emoji: '☁️', hindi: 'बादल छाए रहेंगे', telugu: 'దట్టమైన మేఘాలు' },
  45: { condition: 'Fog', emoji: '🌫️', hindi: 'कोहरा', telugu: 'పొగమంచు' },
  48: { condition: 'Depositing rime fog', emoji: '🌫️', hindi: 'घना कोहरा', telugu: 'దట్టమైన పొగమంచు' },
  51: { condition: 'Light drizzle', emoji: '🌦️', hindi: 'हल्की बूंदाबांदी', telugu: 'తేలికపాటి చినుకులు' },
  53: { condition: 'Moderate drizzle', emoji: '🌦️', hindi: 'मध्यम बूंदाबांदी', telugu: 'మోస్తరు చినుకులు' },
  55: { condition: 'Dense drizzle', emoji: '🌧️', hindi: 'घनी बूंदाबांदी', telugu: 'దట్టమైన చినుకులు' },
  56: { condition: 'Light freezing drizzle', emoji: '🌧️❄️', hindi: 'जमी हुई बूंदाबांदी', telugu: 'మంచు చినుకులు' },
  57: { condition: 'Dense freezing drizzle', emoji: '🌧️❄️', hindi: 'घनी जमी हुई बूंदाबांदी', telugu: 'భారీ మంచు చినుకులు' },
  61: { condition: 'Slight rain', emoji: '🌧️', hindi: 'हल्की बारिश', telugu: 'తేలికపాటి వర్షం' },
  63: { condition: 'Moderate rain', emoji: '🌧️', hindi: 'मध्यम बारिश', telugu: 'మోస్తరు వర్షం' },
  65: { condition: 'Heavy rain', emoji: '🌧️🌧️', hindi: 'भारी बारिश', telugu: 'భారీ వర్షం' },
  66: { condition: 'Freezing rain', emoji: '🌧️❄️', hindi: 'बर्फीली बारिश', telugu: 'మంచు వర్షం' },
  67: { condition: 'Heavy freezing rain', emoji: '🌧️❄️', hindi: 'भारी बर्फीली बारिश', telugu: 'తీవ్రమైన మంచు వర్షం' },
  71: { condition: 'Slight snow fall', emoji: '🌨️', hindi: 'हल्की बर्फबारी', telugu: 'తేలికపాటి హిమపాతం' },
  73: { condition: 'Moderate snow fall', emoji: '🌨️', hindi: 'मध्यम बर्फबारी', telugu: 'మోస్తరు హిమపాతం' },
  75: { condition: 'Heavy snow fall', emoji: '❄️❄️', hindi: 'भारी बर्फबारी', telugu: 'భారీ హిమపాతం' },
  77: { condition: 'Snow grains', emoji: '❄️', hindi: 'बर्फ के दाने', telugu: 'మంచు రేణువులు' },
  80: { condition: 'Slight rain showers', emoji: '🌦️', hindi: 'हल्की बौछारें', telugu: 'తేలికపాటి జల్లులు' },
  81: { condition: 'Moderate rain showers', emoji: '🌧️', hindi: 'मध्यम बौछारें', telugu: 'మోస్తరు వర్షపు జల్లులు' },
  82: { condition: 'Violent rain showers', emoji: '⛈️', hindi: 'तेज बौछारें', telugu: 'తీవ్రమైన వర్షపు జల్లులు' },
  85: { condition: 'Slight snow showers', emoji: '🌨️', hindi: 'हल्की बर्फ की बौछारें', telugu: 'తేలికపాటి మంచు జల్లులు' },
  86: { condition: 'Heavy snow showers', emoji: '❄️🌨️', hindi: 'भारी बर्फ की बौछारें', telugu: 'భారీ మంచు జల్లులు' },
  95: { condition: 'Thunderstorm', emoji: '⛈️', hindi: 'गरज के साथ तूफान', telugu: 'ఉరుములతో కూడిన వర్షం' },
  96: { condition: 'Thunderstorm with slight hail', emoji: '⛈️🧊', hindi: 'ओलावृष्टि के साथ तूफान', telugu: 'వడగండ్ల వర్షం' },
  99: { condition: 'Thunderstorm with heavy hail', emoji: '⛈️⚠️', hindi: 'भारी ओलावृष्टि व तूफान', telugu: 'తీవ్ర వడగండ్ల తుఫాను' },
};

export function getWMOInfo(code: number): WMODescription {
  return WMO_CODES[code] || {
    condition: 'Variable Weather',
    emoji: '⛅',
    hindi: 'परिवर्तनशील मौसम',
    telugu: 'మారుతున్న వాతావరణం',
  };
}
