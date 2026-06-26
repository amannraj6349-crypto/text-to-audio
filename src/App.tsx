import React, { useState } from "react";
import VoiceRecorder from "./components/VoiceRecorder";
import VoiceDetector from "./components/VoiceDetector";
import SpeechSynthesizer from "./components/SpeechSynthesizer";
import { AudioSample, VoiceAnalysis, VoiceName } from "./types";
import { Volume2, Sparkles, Languages, HelpCircle, AudioLines, Info } from "lucide-react";

export default function App() {
  const [referenceAudio, setReferenceAudio] = useState<AudioSample | null>(null);
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Zephyr");

  const handleAudioReady = (sample: AudioSample) => {
    setReferenceAudio(sample);
  };

  const handleClearAudio = () => {
    setReferenceAudio(null);
    setAnalysis(null);
    setSelectedVoice("Zephyr");
  };

  const handleAnalysisResult = (analysisResult: VoiceAnalysis) => {
    setAnalysis(analysisResult);
  };

  const handleVoiceOverride = (voice: VoiceName) => {
    setSelectedVoice(voice);
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-[#e0d8d0] flex flex-col font-sans relative overflow-x-hidden" id="applet-viewport">
      {/* Background Atmosphere Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3a1510] rounded-full blur-[130px] opacity-40"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#ff4e00] rounded-full blur-[150px] opacity-10"></div>
      </div>

      {/* Premium Dark Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/40 py-6 px-6 sticky top-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#ff4e00] text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,78,0,0.5)] transition-transform duration-300 hover:rotate-12">
              <Languages className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-medium text-white tracking-tight flex items-center gap-2">
                Swara<span className="text-[#ff4e00] font-bold">AI</span>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-[#ff4e00]/10 text-[#ff4e00] rounded-full border border-[#ff4e00]/20 flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5" /> Studio Mode
                </span>
              </h1>
              <p className="text-xs text-white/60">English or Hindi text spoken in Hindi with your uploaded voice characteristics</p>
            </div>
          </div>

          <div className="text-left sm:text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-white/40 block tracking-widest">Voice Engine Status</span>
            <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5 justify-end mt-0.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Clone Pipeline Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        
        {/* Concept Card Banner */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs text-left relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 bg-[#ff4e00]/5 rounded-full filter blur-xl" />
          <h2 className="text-base font-medium text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#ff4e00]" />
            What is Hindi Voice Matcher?
          </h2>
          <p className="text-sm text-white/70 mt-2 leading-relaxed font-sans font-light">
            An premium sound modeling workspace where you can upload any person's spoken audio and turn text into Hindi speech matching the reference characteristics. The engine extracts apparent gender, pitch levels, tone, and tempo, aligning standard synthesized prebuilt models to match the reference quality.
          </p>
        </div>

        {/* Step 1: Voice Recorder + File Drag & Drop */}
        <div className="space-y-4">
          <VoiceRecorder
            onAudioReady={handleAudioReady}
            onClear={handleClearAudio}
            selectedSample={referenceAudio}
          />
        </div>

        {/* AI Voice Analyzer (Displays detailed analysis metrics once file is ready) */}
        <VoiceDetector
          sample={referenceAudio}
          onAnalysisResult={handleAnalysisResult}
          selectedVoiceOverride={selectedVoice}
          onVoiceOverrideChange={handleVoiceOverride}
        />

        {/* Step 2: Speech Synthesizer */}
        <SpeechSynthesizer
          referenceAudio={referenceAudio}
          matchedVoice={selectedVoice}
        />

        {/* Pro Guidance & Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Info className="h-4 w-4 text-[#ff4e00]" />
              Pro Tips: Perfect Voice Clones
            </h3>
            <ul className="space-y-2.5 text-xs text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-[#ff4e00] font-bold">•</span>
                <span><strong>Acoustics:</strong> Record in a dry quiet room with minimal background noise or echo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff4e00] font-bold">•</span>
                <span><strong>Clear Speech:</strong> Read 5-10 seconds of clear English or Hindi at a steady pace.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ff4e00] font-bold">•</span>
                <span><strong>Timbre Quality:</strong> High quality WAV/FLAC sample recordings facilitate precise spectral profiling.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <HelpCircle className="h-4 w-4 text-[#ff4e00]" />
              How we do it safely
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              We process speech characteristics server-side inside sandboxed Google Cloud Run nodes. This protects environment secrets and handles audio safely. Vocal metrics are extracted dynamically during the synthesis loop and never recorded or stored permanently.
            </p>
          </div>
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="relative z-10 bg-black/20 border-t border-white/10 py-6 px-6 mt-12 text-center text-xs text-white/40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p>© 2026 SwaraAI Studio. High-fidelity Hindi Speech Synthesis & Voice Profiler.</p>
          <p className="font-mono text-[10px] text-white/30">Target: Local Hindi (IN) • Format: 24,000Hz Wave</p>
        </div>
      </footer>
    </div>
  );
}
