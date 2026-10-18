import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, Send, X, Radio, Volume2, Sparkles, Activity, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { voiceEngine } from '../services/voiceEngine';

interface CeezaVoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioRecorded: (audioBlob: Blob, base64Data: string, mimeType: string) => void;
}

export const CeezaVoiceInputModal: React.FC<CeezaVoiceInputModalProps> = ({
  isOpen,
  onClose,
  onAudioRecorded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      cleanupRecording();
    }

    return () => {
      cleanupRecording();
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      // Immediately stop any ongoing audio playback in interruptible mode
      voiceEngine.interrupt('user_mic_record');

      setAudioBlob(null);
      setAudioBase64(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Web Audio API setup for level visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Determine supported recorder mime type
      let recordMime = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recordMime = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        recordMime = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        recordMime = 'audio/ogg';
      }
      setMimeType(recordMime);

      const recorder = new MediaRecorder(stream, { mimeType: recordMime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recordMime });
        setAudioBlob(blob);

        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          // Extract base64 part
          const base64 = resultStr.split(',')[1] || '';
          setAudioBase64(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(100);
      setIsRecording(true);
      triggerHaptic(25);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone for Ceeza Voice:', err);
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    triggerHaptic(20);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const cleanupRecording = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const handleSend = () => {
    if (audioBlob && audioBase64) {
      triggerHaptic(30);
      onAudioRecorded(audioBlob, audioBase64, mimeType);
      cleanupRecording();
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-dark w-full max-w-md p-6 rounded-[2.5rem] border border-[#F38020]/40 shadow-[0_0_50px_rgba(243,128,32,0.25)] relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F38020]/20 border border-[#FAAD3F]/40 text-[#FAAD3F]">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg italic leading-tight text-white">
                  Ceeza Neural Voice DSP
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FAAD3F]">
                  High-Precision Audio Capture
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                cleanupRecording();
                onClose();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Central Visualizer Orb & Level Waves */}
          <div className="py-8 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center mb-6">
              {/* Outer Pulsing Wave Rings */}
              <motion.div
                animate={{
                  scale: isRecording ? [1, 1.2 + audioLevel / 200, 1] : 1,
                  opacity: isRecording ? [0.4, 0.8, 0.4] : 0.2,
                }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-[#F38020]/30 to-[#FAAD3F]/20 blur-xl"
              />

              {/* Core Microphone Sphere */}
              <div
                className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 relative z-10 ${
                  isRecording
                    ? 'border-[#FAAD3F] bg-gradient-to-b from-[#182338] to-[#0c121e] shadow-[0_0_40px_rgba(243,128,32,0.5)]'
                    : 'border-white/20 bg-[#131a28]'
                }`}
              >
                <Mic
                  size={36}
                  className={isRecording ? 'text-[#FAAD3F] animate-bounce' : 'text-slate-400'}
                />

                {/* Level Meter Badge */}
                <span className="text-[11px] font-mono font-bold text-[#FAAD3F] mt-1">
                  {isRecording ? `${audioLevel}% Level` : 'Ready'}
                </span>
              </div>
            </div>

            {/* Live Frequency Bar Graphic */}
            <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs mb-3">
              {[...Array(16)].map((_, i) => {
                const barHeight = isRecording
                  ? Math.max(15, Math.min(100, (audioLevel * ((i % 5) + 1)) / 3))
                  : 10;
                return (
                  <motion.div
                    key={i}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-2 rounded-full transition-colors ${
                      isRecording
                        ? i % 2 === 0
                          ? 'bg-[#F38020]'
                          : 'bg-[#FAAD3F]'
                        : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {/* Recording Timer */}
            <div className="flex items-center gap-2 font-mono text-sm tracking-widest text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
              <span>{formatTime(recordingTime)}</span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Square size={16} className="fill-current" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Mic size={16} />
                <span>Record Again</span>
              </button>
            )}

            {audioBase64 && !isRecording && (
              <button
                onClick={handleSend}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#F38020] to-[#FAAD3F] hover:brightness-110 text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(243,128,32,0.4)]"
              >
                <Send size={16} className="stroke-[3]" />
                <span>Submit to GOD AI</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
