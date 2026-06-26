export type VoiceName = "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";

export interface VoiceAnalysis {
  gender: "Male" | "Female" | "Ambiguous";
  pitch: string;
  tone: string;
  accent: string;
  speed: "Slow" | "Normal" | "Fast";
  bestMatchVoice: VoiceName;
  summary: string;
}

export interface SpeechGenerationResult {
  translatedText: string;
  wavBase64: string;
}

export interface AudioSample {
  name: string;
  size: string;
  base64: string;
  mimeType: string;
  duration?: number;
  previewUrl?: string;
}
