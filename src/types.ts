export type CropType = 'Paddy' | 'Cotton' | 'Soybean' | 'Groundnut' | 'Maize' | 'Pulses';

export type GrowthStage = 'Pre-sowing' | 'Sowing' | 'Vegetative' | 'Flowering' | 'Maturity';

export type RiskCategory = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

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

export interface ClimateIndices {
  enso: {
    phase: string;
    strength: string;
    oni: number;
  };
  iod: {
    phase: string;
    dmi: number;
  };
  mjo: {
    phase: number;
    amplitude: number;
  };
  note: string;
}

export interface DailyRainfallPoint {
  date: string;
  dayName: string;
  rain_mm: number;
  max_temp: number;
  min_temp: number;
  condition: string;
  emoji: string;
  wind_kmh?: number;
}

export interface MonsoonOutlook {
  location: string;
  country?: string;
  latitude: number;
  longitude: number;
  onset_probability_pct: number;
  break_probability_pct: number;
  heavy_rain_probability_pct: number;
  heavy_rain_dates: string[];
  confidence: 'low' | 'medium' | 'high';
  window_days: number;
  rationale: string;
  climate_indices: ClimateIndices;
  daily_rainfall: DailyRainfallPoint[];
}

export interface RiskGridPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  risk_category: RiskCategory;
  onset_probability_pct: number;
  break_probability_pct: number;
  heavy_rain_flag: boolean;
  confidence: 'low' | 'medium' | 'high';
  rationale?: string;
}

export interface CropAdvisory {
  crop: CropType;
  growth_stage: GrowthStage;
  risk_category: RiskCategory;
  action: string;
  details: string;
  heavy_rain_flag: boolean;
  rule_applied?: string;
}

export interface LocationSummary {
  location: string;
  country?: string;
  latitude: number;
  longitude: number;
  temperature: number;
  condition: string;
  emoji: string;
  windSpeed: number;
  precipitation?: number;
  humidity?: number;
  maxTemp?: number;
  minTemp?: number;
  weatherCode?: number;
  forecast14Day?: DailyRainfallPoint[];
  outlook?: MonsoonOutlook;
  gridPoints?: RiskGridPoint[];
}

export interface WeatherAlert {
  type: 'heavy_rain' | 'high_wind' | 'heatwave' | 'cold_wave';
  title: string;
  severity: 'warning' | 'advisory';
  value: string;
  threshold: string;
  advisoryText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isVoice?: boolean;
  timestamp: number;
  alerts?: WeatherAlert[];
  locationSummary?: LocationSummary;
  outlook?: MonsoonOutlook;
  gridPoints?: RiskGridPoint[];
  cropAdvisory?: CropAdvisory;
  crop?: CropType;
  growthStage?: GrowthStage;
  language?: string;
}

export interface VoiceLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export interface ParsedKrishiSections {
  currentWeather?: string;
  monsoonOutlook?: string;
  riskMap?: string;
  agronomicAdvisory?: string;
  otherText?: string;
  isStructured: boolean;
}

export const CROP_OPTIONS: { type: CropType; icon: string; name: string; localHindi: string }[] = [
  { type: 'Paddy', icon: '🌾', name: 'Paddy (Rice)', localHindi: 'धान / चावल' },
  { type: 'Cotton', icon: '☁️', name: 'Cotton', localHindi: 'कपास' },
  { type: 'Soybean', icon: '🌱', name: 'Soybean', localHindi: 'सोयाबीन' },
  { type: 'Groundnut', icon: '🥜', name: 'Groundnut', localHindi: 'मूंगफली' },
  { type: 'Maize', icon: '🌽', name: 'Maize (Corn)', localHindi: 'मक्का' },
  { type: 'Pulses', icon: '🫘', name: 'Pulses (Tur/Urad/Moong)', localHindi: 'दालें / दलहन' },
];

export const GROWTH_STAGE_OPTIONS: { stage: GrowthStage; name: string; localHindi: string; desc: string }[] = [
  { stage: 'Pre-sowing', name: 'Pre-sowing', localHindi: 'बुवाई पूर्व', desc: 'Land prep & seed procurement' },
  { stage: 'Sowing', name: 'Sowing', localHindi: 'बुवाई', desc: 'Active seeding / transplanting' },
  { stage: 'Vegetative', name: 'Vegetative', localHindi: 'वानस्पतिक वृद्धि', desc: 'Canopy growth & tillering' },
  { stage: 'Flowering', name: 'Flowering', localHindi: 'फूल आना / परागण', desc: 'Moisture-critical peak' },
  { stage: 'Maturity', name: 'Maturity', localHindi: 'परिपक्वता / कटाई', desc: 'Grain filling & harvest' },
];

export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  { code: 'auto', name: 'Auto-Detect', nativeName: 'Auto', speechCode: 'en-IN' },
  { code: 'en', name: 'English (India)', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
];
