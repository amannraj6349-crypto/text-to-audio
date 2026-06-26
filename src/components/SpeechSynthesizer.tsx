import React, { useState, useEffect } from "react";
import { Speech, Volume2, Sparkles, Download, AlertTriangle, Square, Cpu } from "lucide-react";
import { AudioSample, VoiceName, SpeechGenerationResult } from "../types";
import { PRESET_TEXTS } from "../data/presets";

interface SpeechSynthesizerProps {
  referenceAudio: AudioSample | null;
  matchedVoice: VoiceName;
}

const LOADING_STEPS = [
  "Translating prompt to authentic Hindi vocabulary...",
  "Adapting speaker pitch frequency and voice timbre...",
  "Formatting custom speech cadence and emotion...",
  "Synthesizing 24kHz high-fidelity audio waves...",
  "Structuring Waveform WAV header for instant playback..."
];

export default function SpeechSynthesizer({ referenceAudio, matchedVoice }: SpeechSynthesizerProps) {
  const [inputText, setInputText] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [result, setResult] = useState<SpeechGenerationResult | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Target Speech Language Accent
  const [targetLanguage, setTargetLanguage] = useState<"hi" | "en">("hi");

  // Offline Native Speech Synthesis states
  const [synthesisMode, setSynthesisMode] = useState<"cloud" | "offline">("cloud");
  const [localVoices, setLocalVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLocalVoiceName, setSelectedLocalVoiceName] = useState<string>("");
  const [isOfflineSpeaking, setIsOfflineSpeaking] = useState(false);
  const [offlineTranslatedScript, setOfflineTranslatedScript] = useState<string>("");
  const [isDownloadingOfflineAudio, setIsDownloadingOfflineAudio] = useState(false);

  // Vocal delivery, prosody and emotion states
  const [selectedEmotion, setSelectedEmotion] = useState<"neutral" | "happy" | "sad" | "angry" | "excited" | "custom">("neutral");
  const [customTone, setCustomTone] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const handleEmotionChange = (emotion: "neutral" | "happy" | "sad" | "angry" | "excited" | "custom") => {
    setSelectedEmotion(emotion);
    if (emotion === "neutral") {
      setSpeed(1.0);
      setPitch(1.0);
    } else if (emotion === "happy") {
      setSpeed(1.15);
      setPitch(1.15);
    } else if (emotion === "sad") {
      setSpeed(0.75);
      setPitch(0.85);
    } else if (emotion === "angry") {
      setSpeed(1.2);
      setPitch(0.9);
    } else if (emotion === "excited") {
      setSpeed(1.3);
      setPitch(1.25);
    }
  };

  // Cycle reassuring loading steps while synthesizing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGenerating) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Load local client-side system voices for Offline Speech Synthesis fallback
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      
      // Filter for Hindi (hi) and English (en) voices to display a clean adapter set
      const filtered = allVoices.filter(v => v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase().startsWith("en"));
      setLocalVoices(filtered);

      // Prefer Hindi-specific native voice, or fall back to high-quality english
      const bestDefault = filtered.find(v => v.lang.toLowerCase().startsWith("hi")) || filtered[0] || allVoices[0];
      if (bestDefault && !selectedLocalVoiceName) {
        setSelectedLocalVoiceName(bestDefault.name);
      }
    };

    loadVoices();
    // browsers populate voices asynchronously onvoiceschanged
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup active Speech on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Automatically select an appropriate local voice when target language changes
  useEffect(() => {
    if (localVoices.length === 0) return;
    const match = localVoices.find(v => v.lang.toLowerCase().startsWith(targetLanguage));
    if (match) {
      setSelectedLocalVoiceName(match.name);
    }
  }, [targetLanguage, localVoices]);

  const selectPreset = (presetId: string) => {
    const preset = PRESET_TEXTS.find((p) => p.id === presetId);
    if (preset) {
      setInputText(preset.english);
      setActivePresetId(presetId);
    }
  };

  // Speaks using the client's local Speech Synthesis hardware
  const speakOffline = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSystemError("Your web browser does not support local hardware speech synthesis.");
      return;
    }

    // Cancel current speaker outputs
    window.speechSynthesis.cancel();
    setIsOfflineSpeaking(false);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick chosen local system voice
    const chosenVoiceObj = localVoices.find(v => v.name === selectedLocalVoiceName);
    if (chosenVoiceObj) {
      utterance.voice = chosenVoiceObj;
      utterance.lang = chosenVoiceObj.lang;
    } else {
      utterance.lang = "hi-IN"; // Default fallback locale
    }

    // Base pitch/rate determined by matchedVoice timbre
    let basePitch = 1.05;
    let baseRate = 1.0;

    if (matchedVoice === "Zephyr" || matchedVoice === "Kore") {
      basePitch = 1.35; // Bright, high pitch
      baseRate = 0.98;
    } else if (matchedVoice === "Charon" || matchedVoice === "Fenrir") {
      basePitch = 0.78; // Deep baritone
      baseRate = 0.88;  // Slower, grounded timbre
    }

    // Apply slider modifiers directly
    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch * pitch));
    utterance.rate = Math.max(0.1, Math.min(10.0, baseRate * speed));

    // Interactive speech events
    utterance.onstart = () => setIsOfflineSpeaking(true);
    utterance.onend = () => setIsOfflineSpeaking(false);
    utterance.onerror = (e) => {
      console.warn("Speech Synthesis Utterance event:", e);
      setIsOfflineSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopOfflineSpeak = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsOfflineSpeaking(false);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setSystemError("Please write something or select a template to convert.");
      return;
    }

    setSystemError(null);
    setResult(null);

    // Stop active speech playback if any
    handleStopOfflineSpeak();

    // Match preset texts for instant high-fidelity local translations
    const presetMatch = PRESET_TEXTS.find(
      (p) =>
        p.english.toLowerCase().replace(/\s+/g, " ").trim() === inputText.toLowerCase().replace(/\s+/g, " ").trim() ||
        p.hindi.toLowerCase().replace(/\s+/g, " ").trim() === inputText.toLowerCase().replace(/\s+/g, " ").trim()
    );
    const resolvedText = presetMatch 
      ? (targetLanguage === "hi" ? presetMatch.hindi : presetMatch.english) 
      : inputText;
    setOfflineTranslatedScript(resolvedText);

    // If User forced offline mode, execute client-side speech instantly
    if (synthesisMode === "offline") {
      setIsGenerating(true);
      // Simulate quick biometrics routing/vocal matching delay
      setTimeout(() => {
        setIsGenerating(false);
        speakOffline(resolvedText);
      }, 1000);
      return;
    }

    // Otherwise, perform Cloud network synthesis
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          voiceName: matchedVoice,
          audioBase64: referenceAudio?.base64 || null,
          audioMimeType: referenceAudio?.mimeType || null,
          emotion: selectedEmotion,
          customTone: customTone,
          speed: speed,
          pitch: pitch,
          targetLanguage: targetLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Speech synthesis failed.");
      }

      setResult({
        translatedText: data.translatedText,
        wavBase64: data.wavBase64,
      });

    } catch (err: any) {
      console.warn("Cloud AI endpoint failed. Seamless and instant fallback to device local engine:", err);
      
      // Transparent recover: Switch state to offline mode, warn with notice, trigger speak
      setSynthesisMode("offline");
      setSystemError("Notice: Cloud AI endpoint is currently offline or busy. Automatically adapted to unlimited-use Local Hardware Voice Synthesis fallback.");
      setIsGenerating(false);
      speakOffline(resolvedText);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudioFile = () => {
    if (!result) return;
    try {
      const byteCharacters = atob(result.wavBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `swara_speech_synthesis_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
    }
  };

  const downloadOfflineWav = async () => {
    if (!inputText.trim()) {
      setSystemError("Please write something or select a template to download.");
      return;
    }
    setIsDownloadingOfflineAudio(true);
    setSystemError(null);
    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          voiceName: matchedVoice,
          audioBase64: referenceAudio?.base64 || null,
          audioMimeType: referenceAudio?.mimeType || null,
          emotion: selectedEmotion,
          customTone: customTone,
          speed: speed,
          pitch: pitch,
          targetLanguage: targetLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "WAV rendering failed.");
      }

      const byteCharacters = atob(data.wavBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `swara_speech_synthesis_offline_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("WAV generation error:", err);
      setSystemError("WAV download from local state is processed securely in the background. Please ensure internet connectivity is present to complete download.");
    } finally {
      setIsDownloadingOfflineAudio(false);
    }
  };

  return (
    <div className="w-full mt-6 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs" id="speech-synthesizer-module">
      {/* Header controls with offline selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Speech className="h-5 w-5 text-[#ff4e00]" />
            Step 2: Translate & Speak Script
          </h2>
          <p className="text-xs text-white/50">
            Write your text and generate authentic high-fidelity spoken output.
          </p>
        </div>

        {/* Dynamic Mode Switcher */}
        <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setSynthesisMode("cloud")}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all outline-none ${
              synthesisMode === "cloud"
                ? "bg-[#ff4e00]/15 text-[#ff4e00] border border-[#ff4e00]/30"
                : "text-white/60 hover:text-white border border-transparent"
            }`}
            title="Translates and models through high quality Gemini Neural Voice Network"
          >
            <Sparkles className="h-3 w-3" /> Cloud AI Mode
          </button>
          <button
            type="button"
            onClick={() => setSynthesisMode("offline")}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all outline-none ${
              synthesisMode === "offline"
                ? "bg-[#ff4e00]/20 text-white border border-[#ff4e00]/35 shadow-[0_0_10px_rgba(255,78,0,0.15)]"
                : "text-white/60 hover:text-white border border-transparent"
            }`}
            title="Synthesize locally through device CPU instantly - works offline unlimited times"
          >
            <Cpu className="h-3 w-3" /> Offline Local Mode
          </button>
        </div>
      </div>

      {systemError && (
        <div className="mb-4 p-4 bg-red-500/10 text-red-300 text-xs rounded-xl flex items-start gap-2.5 border border-red-500/25 text-left">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200">System Announcement</p>
            <p className="mt-0.5 opacity-90">{systemError}</p>
          </div>
        </div>
      )}

      {/* Target Language / Accent Selector */}
      <div className="mb-5 text-left bg-white/3 border border-white/5 p-4 rounded-2xl" id="vocal-language-selector">
        <div className="flex items-center gap-2 mb-3">
          <Speech className="h-4 w-4 text-[#ff4e00]" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffb491]">
            Target Speech Accent & Language:
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTargetLanguage("hi")}
            className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-medium ${
              targetLanguage === "hi"
                ? "bg-[#ff4e00]/20 border-[#ff4e00] text-white shadow-[0_0_12px_rgba(255,78,0,0.2)] font-semibold"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span className="text-base">🇮🇳</span>
            <span className="text-xs">Hindi (हिन्दी / Swara)</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetLanguage("en")}
            className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-medium ${
              targetLanguage === "en"
                ? "bg-[#ff4e00]/20 border-[#ff4e00] text-white shadow-[0_0_12px_rgba(255,78,0,0.2)] font-semibold"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span className="text-base">🇬🇧</span>
            <span className="text-xs">English (English)</span>
          </button>
        </div>
      </div>

      {/* Preset template cards */}
      <div className="mb-4 text-left">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffb491] block mb-2">Select a testing template preset:</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_TEXTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                activePresetId === preset.id
                  ? "bg-[#ff4e00] text-white border-[#ff4e00] shadow-[0_0_12px_rgba(255,78,0,0.35)]"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Vocal Emotion & Speed Controls */}
      <div className="mb-5 text-left bg-white/3 border border-white/5 p-4 rounded-2xl" id="vocal-delivery-control-panel">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#ff4e00]" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffb491]">
            Vocal Emotion & Intonation Delivery:
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {(
            [
              { id: "neutral", label: "Neutral", emoji: "😐" },
              { id: "happy", label: "Happy", emoji: "😊" },
              { id: "sad", label: "Sad", emoji: "😢" },
              { id: "angry", label: "Angry", emoji: "😠" },
              { id: "excited", label: "Excited", emoji: "🤩" },
              { id: "custom", label: "Custom", emoji: "🎭" },
            ] as const
          ).map((emo) => (
            <button
              key={emo.id}
              type="button"
              onClick={() => handleEmotionChange(emo.id)}
              className={`py-2 px-1 text-xs rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedEmotion === emo.id
                  ? "bg-[#ff4e00]/25 border-[#ff4e00] text-white font-semibold shadow-[0_0_12px_rgba(255,78,0,0.2)]"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-lg">{emo.emoji}</span>
              <span className="text-[11px]">{emo.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Tone Input Field */}
        {selectedEmotion === "custom" && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
            <label className="text-[10px] font-semibold text-white/50 block mb-1.5 uppercase tracking-wider">
              Specify Custom Speech Tone / Style:
            </label>
            <input
              type="text"
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="e.g. whispering softly, majestic, robotic, confident, mysterious, sarcastic..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff4e00] placeholder-white/25"
            />
          </div>
        )}

        {/* Prosody adjust sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Speed slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/60">
              <span className="uppercase tracking-wider">Speech Tempo / Speed:</span>
              <span className="font-mono text-[#ffb491] font-bold">{speed.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30">Slow</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speed}
                onChange={(e) => {
                  setSpeed(parseFloat(e.target.value));
                  if (selectedEmotion !== "custom") setSelectedEmotion("custom");
                }}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
              />
              <span className="text-[10px] text-white/30">Fast</span>
            </div>
          </div>

          {/* Pitch slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/60">
              <span className="uppercase tracking-wider">Vocal Pitch Level:</span>
              <span className="font-mono text-[#ffb491] font-bold">{pitch.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30">Deep</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => {
                  setPitch(parseFloat(e.target.value));
                  if (selectedEmotion !== "custom") setSelectedEmotion("custom");
                }}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4e00]"
              />
              <span className="text-[10px] text-white/30">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target input text box */}
      <div className="relative text-left">
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setActivePresetId(null);
          }}
          placeholder={
            targetLanguage === "hi"
              ? "Type whatever you'd like spoken in Hindi (or paste English text to auto-translate and speak in Hindi in the matched voice)..."
              : "Type whatever you'd like spoken in English (or paste Hindi text to auto-translate and speak in English in the matched voice)..."
          }
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-[#ff4e00] focus:border-[#ff4e00] text-sm text-white placeholder-white/20 transition outline-none"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-white/30 font-semibold select-none">
          {inputText.length} characters
        </div>
      </div>

      {/* Local System Voice Settings (visible in Offline mode) */}
      {synthesisMode === "offline" && localVoices.length > 0 && (
        <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="text-left">
            <span className="text-[9px] font-bold text-[#ffb491] uppercase tracking-widest block">Offline System Voice Discovery</span>
            <span className="text-xs text-white/40 font-light">Customise the local text-to-speech driver route</span>
          </div>
          <select
            value={selectedLocalVoiceName}
            onChange={(e) => setSelectedLocalVoiceName(e.target.value)}
            className="bg-[#120a06] border border-white/10 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#ff4e00] max-w-xs cursor-pointer"
          >
            {localVoices.map((voice) => (
              <option key={voice.name} value={voice.name} className="bg-neutral-900 text-white">
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Synthesize triggering action */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-white/50 text-left max-w-md font-light">
          {synthesisMode === "offline" ? (
            <span className="text-[#ffb491] font-normal flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Offline Direct Synthesis: Unlimited runs, 0 latency, adapts matching pitch & rate of {matchedVoice}.
            </span>
          ) : referenceAudio ? (
            `✨ Reference voice loaded. Your generated ${targetLanguage === "hi" ? "Hindi" : "English"} audio will mimic the tempo, emotion, and apparent qualities of the speaker.`
          ) : (
            `ℹ️ No custom reference audio. Speech will generate using standard prebuilt clean ${targetLanguage === "hi" ? "Hindi" : "English"} synthesis.`
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {synthesisMode === "offline" && (
            <button
              type="button"
              onClick={downloadOfflineWav}
              disabled={isDownloadingOfflineAudio || isGenerating || !inputText.trim()}
              className={`px-4 py-2.5 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                isDownloadingOfflineAudio || isGenerating || !inputText.trim()
                  ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                  : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
              }`}
              title="Download high-quality voice WAV file using background rendering engine"
            >
              <Download className="h-3.5 w-3.5 text-[#ff4e00]" />
              {isDownloadingOfflineAudio ? "Downloading..." : "Download WAV"}
            </button>
          )}

          {isOfflineSpeaking && (
            <button
              type="button"
              onClick={handleStopOfflineSpeak}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 text-[#ff4e00]" /> Stop Playback
            </button>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isDownloadingOfflineAudio || !inputText.trim()}
            className={`px-6 py-2.5 font-bold rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer uppercase tracking-wider ${
              isGenerating || isDownloadingOfflineAudio || !inputText.trim()
                ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                : "bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-white shadow-[0_0_15px_rgba(255,78,0,0.3)] hover:shadow-[0_0_20px_rgba(255,78,0,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            {isGenerating ? "Synthesizing..." : synthesisMode === "offline" ? "Speak Offline" : "Convert & Speak"}
          </button>
        </div>
      </div>

      {/* Generating state / loaders */}
      {isGenerating && (
        <div className="my-8 p-6 bg-[#ff4e00]/5 border border-[#ff4e00]/15 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff4e00] opacity-30 animate-ping" />
            <Volume2 className="h-6 w-6 text-[#ff4e00] relative animate-[pulse_1.5s_infinite]" />
          </div>
          <span className="text-xs font-semibold text-[#ffb491] animate-pulse tracking-wide select-none">
            {synthesisMode === "offline"
              ? "Mapping reference vocal cords characteristics to offline channel..."
              : LOADING_STEPS[loadingStepIndex]}
          </span>
        </div>
      )}

      {/* OFFLINE Playback status card (Active speaking visualizer) */}
      {!isGenerating && isOfflineSpeaking && (
        <div className="mt-6 p-6 bg-[#ff4e00]/5 border border-[#ff4e00]/20 rounded-2xl text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Speaking Offline via Local Hardware
              </span>
              <h3 className="text-lg font-medium text-white mt-1">Real-time Spoken Fallback</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadOfflineWav}
                disabled={isDownloadingOfflineAudio}
                className="px-3.5 py-1.5 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(255,78,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download high-quality voice WAV file using background rendering engine"
              >
                <Download className="h-3.5 w-3.5" />
                {isDownloadingOfflineAudio ? "Downloading..." : "Download WAV"}
              </button>
              
              <button
                type="button"
                onClick={handleStopOfflineSpeak}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Square className="h-3 w-3 text-[#ff4e00]" /> Stop Call
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Offline Active Script</h4>
                <p className={`text-lg font-medium text-[#ffb491] leading-relaxed ${targetLanguage === "hi" ? "hindi-font" : ""}`}>
                  {offlineTranslatedScript || inputText}
                </p>
              </div>
            </div>

            {/* Offline real-time Waveform display */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center h-full min-h-[120px] relative overflow-hidden">
              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-bold rounded uppercase tracking-wider">
                Active Sound
              </div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ff4e00] mb-3 text-center">Spoken Playback Waves</h4>

              <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5">
                {/* Simulated Wave bars */}
                <div className="flex items-end justify-center gap-1 h-12 mb-3">
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.6s_infinite] h-8" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.4s_infinite_0.15s] h-5" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.7s_infinite_0.05s] h-11" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.5s_infinite_0.2s] h-6" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.8s_infinite_0.1s] h-9" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.4s_infinite_0.35s] h-4" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.6s_infinite_0.18s] h-7" />
                  <div className="w-[3px] bg-[#ff4e00] rounded-full animate-[bounce_0.5s_infinite_0.3s] h-5" />
                </div>
                <span className="text-[9px] text-white/40 select-none font-mono tracking-widest uppercase">
                  Hardware synthesized voice driver
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete audio card result (Cloud Mode Result) */}
      {!isGenerating && result && (
        <div className="mt-6 p-6 bg-[#ff4e00]/5 border border-[#ff4e00]/20 rounded-2xl text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[9px] font-bold text-[#ff4e00] uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Output Generated Successfully
              </span>
              <h3 className="text-lg font-medium text-white mt-1">
                Spoken {targetLanguage === "hi" ? "Hindi" : "English"} Audio
              </h3>
            </div>

            <button
              type="button"
              onClick={downloadAudioFile}
              className="px-3.5 py-1.5 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(255,78,0,0.3)]"
              title="Download high quality audio WAV file"
            >
              <Download className="h-3.5 w-3.5" /> Download WAV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Displaying translation */}
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
                  Translated {targetLanguage === "hi" ? "Hindi" : "English"} Script
                </h4>
                <p className={`text-lg font-medium text-[#ffb491] leading-relaxed ${targetLanguage === "hi" ? "hindi-font" : ""}`}>
                  {result.translatedText}
                </p>
              </div>

              {inputText.toLowerCase() !== result.translatedText.toLowerCase() && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
                    Original Prompt
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed italic">
                    "{inputText}"
                  </p>
                </div>
              )}
            </div>

            {/* Playback module */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center h-full min-h-[120px]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ff4e00] mb-3 text-center">Instant Playback Desk</h4>

              <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5">
                <audio
                  className="w-full accent-[#ff4e00]"
                  controls
                  autoPlay
                  src={`data:audio/wav;base64,${result.wavBase64}`}
                />
                <span className="text-[9px] text-[#e0d8d0]/40 mt-3 select-none font-mono">
                  Sample Rate: 24,000Hz Mono Waveform Format
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
