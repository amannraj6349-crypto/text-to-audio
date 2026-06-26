import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Play, Trash2, AudioLines, Sparkles, CheckCircle2 } from "lucide-react";
import { AudioSample } from "../types";

interface VoiceRecorderProps {
  onAudioReady: (sample: AudioSample) => void;
  onClear: () => void;
  selectedSample: AudioSample | null;
}

export default function VoiceRecorder({ onAudioReady, onClear, selectedSample }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Recording is not supported in this browser. Please upload an audio file instead.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        await processAndEmitAudioBlob(audioBlob, `Microphone Recording`);

        // Stop all tracks to release the microphone hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Recording start error:", err);
      setErrorMessage(err.message || "Failed to start recording. Please allow microphone permissions or upload an audio file.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAndEmitAudioBlob = async (blob: Blob, name: string) => {
    try {
      if (blob.size > 15 * 1024 * 1024) {
        throw new Error("File is too large. Please upload an audio sample under 15MB.");
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        const previewUrl = URL.createObjectURL(blob);

        onAudioReady({
          name: name,
          size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
          base64: base64String,
          mimeType: blob.type || "audio/webm",
          previewUrl: previewUrl,
        });
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process audio file.");
    }
  };

  // Handle file uploads
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processAndEmitAudioBlob(file, file.name);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("audio/")) {
        setErrorMessage("Unsupported file type. Please upload a valid audio file (WAV, MP3, WebM, M4A).");
        return;
      }
      await processAndEmitAudioBlob(file, file.name);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="w-full" id="voice-recorder-module">
      <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2 mb-4">
        <AudioLines className="h-4.5 w-4.5 text-[#ff4e00]" />
        Step 1: Provide reference voice audio
      </h2>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-500/10 text-red-300 text-xs rounded-xl flex items-start gap-2 border border-red-500/25">
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {!selectedSample ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microphone Recording Block */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 hover:border-[#ff4e00]/30 group">
            {isRecording && (
              <div className="absolute inset-0 bg-[#ff4e00]/10 pointer-events-none animate-pulse" />
            )}

            <div className="h-12 w-12 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-300">
              <Mic className={`h-5 w-5 ${isRecording ? "animate-bounce text-[#ff4e00]" : "text-white/60"}`} />
            </div>

            <h3 className="text-sm font-medium text-white mb-1">Record Reference Speak</h3>
            <p className="text-xs text-white/50 max-w-xs mb-4">
              Speak or record 3-10 seconds of clear English, Hindi, or any spoken voice for style analysis.
            </p>

            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-lg font-bold text-[#ff4e00] tracking-wider animate-pulse">
                  {formatTime(recordingSeconds)}
                </span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Square className="h-3.5 w-3.5" /> Stop Recording
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="px-4 py-2 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,78,0,0.3)] hover:shadow-[0_0_20px_rgba(255,78,0,0.5)]"
              >
                <Mic className="h-3.5 w-3.5" /> Start Recording
              </button>
            )}
          </div>

          {/* File Upload Block */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-[#ff4e00] bg-[#ff4e00]/10 scale-[0.98]"
                : "border-white/15 bg-white/5 hover:border-[#ff4e00]/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />
            <div className="h-12 w-12 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-white/40" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Drag & Drop Audio</h3>
            <p className="text-xs text-white/50 max-w-xs mb-4">
              Click to browse or drop an audio file. Recommended size is under 5MB.
            </p>
            <span className="text-[10px] font-bold px-3 py-1 bg-white/5 text-white/60 border border-white/10 rounded-full hover:bg-white/10 transition">
              Select WAV, MP3
            </span>
          </div>
        </div>
      ) : (
        /* Attached Reference Audio View */
        <div className="p-4 bg-[#ff4e00]/5 border border-[#ff4e00]/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#ff4e00] to-[#8a2b00] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#ff4e00]/25">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase text-[#ff4e00] tracking-widest flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> VOICE CLONE ACTIVE
              </span>
              <h3 className="text-sm font-medium text-white truncate max-w-xs sm:max-w-md">
                {selectedSample.name}
              </h3>
              <p className="text-xs text-white/40">{selectedSample.size}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedSample.previewUrl && (
              <audio
                controls
                src={selectedSample.previewUrl}
                className="h-9 w-full sm:w-48 text-xs accent-[#ff4e00]"
              />
            )}
            <button
              type="button"
              onClick={onClear}
              className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              title="Remove reference voice"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
