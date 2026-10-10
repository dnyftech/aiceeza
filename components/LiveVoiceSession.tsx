import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, MessageSquare, Sparkles, ChevronDown, Check, Radio, Activity, Eye, EyeOff } from 'lucide-react';
import Orb, { IndicatingOrb } from './Orb';
import { AudioVisualizer } from './AudioVisualizer';
import { OrbTheme, VoicePersonalityId } from '../types';
import { AVAILABLE_VOICES, VOICE_PERSONALITIES } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';

interface LiveVoiceSessionProps {
  isOpen: boolean;
  onClose: () => void;
  isBotSpeaking: boolean;
  analyserNode: AnalyserNode | null;
  liveTranscription: { text: string; sender: 'user' | 'bot' } | null;
  personalityId: VoicePersonalityId;
  customVoiceName: string;
  onSelectVoice: (voiceName: string) => void;
  orbTheme: OrbTheme;
  isThinking?: boolean;
}

interface TranscriptTurn {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({
  isOpen,
  onClose,
  isBotSpeaking,
  analyserNode,
  liveTranscription,
  personalityId,
  customVoiceName,
  onSelectVoice,
  orbTheme,
  isThinking = false
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptTurn[]>([]);

  // Accumulate live transcriptions into conversation history
  useEffect(() => {
    if (liveTranscription && liveTranscription.text.trim()) {
      setTranscriptHistory(prev => {
        // If last turn matches sender, update it or add new
        const last = prev[prev.length - 1];
        if (last && last.sender === liveTranscription.sender) {
          return [
            ...prev.slice(0, -1),
            { ...last, text: liveTranscription.text }
          ];
        } else {
          return [
            ...prev,
            {
              id: Date.now().toString(),
              sender: liveTranscription.sender,
              text: liveTranscription.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
        }
      });
    }
  }, [liveTranscription]);

  // Reset transcript history on session open
  useEffect(() => {
    if (isOpen) {
      setTranscriptHistory([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeVoice = customVoiceName || VOICE_PERSONALITIES[personalityId]?.voiceName || 'Zephyr';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white backdrop-blur-2xl overflow-hidden"
    >
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: isBotSpeaking
            ? 'radial-gradient(circle at 50% 40%, rgba(250, 173, 63, 0.4) 0%, rgba(243, 128, 32, 0.15) 45%, transparent 70%)'
            : 'radial-gradient(circle at 50% 40%, rgba(66, 133, 244, 0.35) 0%, rgba(52, 168, 83, 0.1) 45%, transparent 70%)'
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBotSpeaking ? 'bg-[#FAAD3F]' : 'bg-emerald-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isBotSpeaking ? 'bg-[#FAAD3F]' : 'bg-emerald-500'}`} />
            </span>
            <span className="text-slate-300 font-medium">
              {isBotSpeaking ? 'Ceeza Speaking' : isMuted ? 'Microphone Muted' : 'Live Listening'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline uppercase">24kHz Low-Latency</span>
          </div>
        </div>

        {/* Voice Selector Pill */}
        <div className="relative">
          <button
            onClick={() => {
              triggerHaptic(15);
              setShowVoicePicker(prev => !prev);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 transition-all cursor-pointer"
          >
            <Radio size={13} className="text-[#FAAD3F]" />
            <span>Voice: <strong className="text-white">{activeVoice}</strong></span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Voice Picker Dropdown */}
          <AnimatePresence>
            {showVoicePicker && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className="absolute right-0 top-10 mt-1 w-64 p-2 rounded-2xl bg-[#0e1626] border border-white/15 shadow-2xl z-50 backdrop-blur-xl"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-white/10">
                  Select Live Voice Profile
                </div>
                <div className="space-y-1 mt-1 max-h-56 overflow-y-auto">
                  {AVAILABLE_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        triggerHaptic(15);
                        onSelectVoice(v.id);
                        setShowVoicePicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left ${
                        activeVoice === v.id
                          ? 'bg-[#4285F4]/20 text-white font-bold border border-[#4285F4]/40'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{v.name}</span>
                          <span className="text-[9px] text-slate-400">({v.variant})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal truncate">
                          {v.style}
                        </div>
                      </div>
                      {activeVoice === v.id && <Check size={14} className="text-[#FAAD3F]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimize / Exit to Chat Button */}
        <button
          onClick={() => {
            triggerHaptic(15);
            onClose();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer"
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">Text Mode</span>
        </button>
      </header>

      {/* Main Center Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-4xl mx-auto w-full">
        
        {/* Central Orb & Visualizer */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Subtle Outer Glowing Ripple Rings */}
          <div className="relative">
            {isBotSpeaking && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FAAD3F] to-[#F38020] blur-xl pointer-events-none"
              />
            )}
            <Orb 
              isActive={isBotSpeaking} 
              size="large" 
              isThinking={isThinking} 
              theme={orbTheme} 
            />
          </div>

          {/* Real-time Frequency Spectrum Audio Visualizer */}
          <div className="w-full max-w-sm mt-4">
            <AudioVisualizer 
              analyser={analyserNode} 
              isActive={!isMuted} 
              isBotSpeaking={isBotSpeaking} 
            />
          </div>

          {/* Current Live Speaking Headline */}
          <div className="mt-6 text-center max-w-xl px-4">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight text-white mb-2">
              {isBotSpeaking ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FAAD3F] to-[#F38020]">
                  Ceeza is speaking...
                </span>
              ) : isMuted ? (
                <span className="text-red-400 font-mono text-sm">
                  Microphone is muted
                </span>
              ) : (
                <span className="text-slate-300">
                  Listening to vocal stream...
                </span>
              )}
            </h2>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Speak naturally at any time to converse or interrupt
            </p>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="w-full max-w-xl mx-auto mb-2">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-[#FAAD3F]" />
              Live Transcript
            </span>
            <button
              onClick={() => {
                triggerHaptic(10);
                setShowTranscript(prev => !prev);
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showTranscript ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{showTranscript ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-h-36 overflow-y-auto p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md space-y-2 text-xs"
              >
                {transcriptHistory.length === 0 && !liveTranscription ? (
                  <p className="text-slate-500 text-center font-mono italic text-[11px] py-2">
                    Spoken conversation will be transcribed here in real time...
                  </p>
                ) : (
                  transcriptHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`flex gap-2.5 ${item.sender === 'user' ? 'text-slate-300' : 'text-white'}`}
                    >
                      <span className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        item.sender === 'user'
                          ? 'bg-blue-500/20 text-[#4285F4]'
                          : 'bg-orange-500/20 text-[#FAAD3F]'
                      }`}>
                        {item.sender === 'user' ? 'You' : 'Ceeza'}
                      </span>
                      <p className="flex-1 leading-relaxed text-[12px]">
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Bottom Professional Control Dock */}
      <footer className="relative z-10 flex items-center justify-center gap-4 md:gap-6 px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-white/10 bg-black/60 backdrop-blur-xl">
        
        {/* Mute / Unmute Microphone */}
        <button
          onClick={() => {
            triggerHaptic(20);
            setIsMuted(prev => !prev);
          }}
          className={`flex flex-col items-center gap-1.5 p-3.5 sm:p-4 rounded-full transition-all cursor-pointer ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Live Call / Session (Big Red Call End Button) */}
        <button
          onClick={() => {
            triggerHaptic(35);
            onClose();
          }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-red-400/40"
          title="End Live Voice Session"
        >
          <PhoneOff size={26} />
        </button>

        {/* Speaker Output Volume Mute Toggle */}
        <button
          onClick={() => {
            triggerHaptic(20);
            setIsSpeakerMuted(prev => !prev);
          }}
          className={`flex flex-col items-center gap-1.5 p-3.5 sm:p-4 rounded-full transition-all cursor-pointer ${
            isSpeakerMuted
              ? 'bg-white/5 text-slate-500 border border-white/10'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
          }`}
          title={isSpeakerMuted ? 'Unmute Speaker Output' : 'Mute Speaker Output'}
        >
          {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

      </footer>
    </motion.div>
  );
};
