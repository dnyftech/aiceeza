import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Mic, 
  Radio, 
  Flashlight, 
  Bell, 
  Clock, 
  Send, 
  Minimize2, 
  X, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Zap, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { androidAssistantService, ActiveTimer } from '../services/androidAssistantService';
import { voiceEngine } from '../services/voiceEngine';

interface AndroidAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveVoice: () => void;
  onMinimizeToBubble: () => void;
}

export const AndroidAssistantOverlay: React.FC<AndroidAssistantOverlayProps> = ({
  isOpen,
  onClose,
  onOpenLiveVoice,
  onMinimizeToBubble,
}) => {
  const [torchActive, setTorchActive] = useState(false);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [activeStatusText, setActiveStatusText] = useState('Listening for Android mobile commands...');

  useEffect(() => {
    setTorchActive(androidAssistantService.getTorchState());
    const unsub = androidAssistantService.subscribeTimers(setActiveTimers);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleTorch = async () => {
    triggerHaptic(25);
    const next = await androidAssistantService.toggleTorch();
    setTorchActive(next);
    setActiveStatusText(next ? 'Flashlight hardware engaged.' : 'Flashlight turned off.');
  };

  const handleQuickTimer = (secs: number, label: string) => {
    triggerHaptic(20);
    androidAssistantService.createTimer(label, secs);
    setActiveStatusText(`Timer started: ${label}`);
  };

  const handleQuickVoiceAction = (actionPrompt: string) => {
    triggerHaptic(20);
    // Notify voice engine to halt existing speech if interruptible
    voiceEngine.notifyMicrophoneActivity();
    voiceEngine.speak(actionPrompt, { interruptible: true });
    setActiveStatusText(actionPrompt);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-2xl bg-[#090d16]/95 border-t border-x border-[#FAAD3F]/40 rounded-t-[2.5rem] p-6 shadow-[0_-10px_50px_rgba(250,173,63,0.25)] text-white relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top handle and controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40">
                <Smartphone size={16} />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Android System Assistant Core
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic(15);
                  onMinimizeToBubble();
                }}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Minimize to Floating Bubble"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Glowing Aura Edge bar */}
          <div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-[#FAAD3F] to-transparent mx-auto rounded-full mb-6" />

          {/* Status banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141d2f] to-[#0f192b] border border-[#FAAD3F]/30 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="w-3 h-3 rounded-full bg-[#FAAD3F] block animate-ping" />
                <span className="w-3 h-3 rounded-full bg-[#FAAD3F] absolute inset-0 block" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">
                  {activeStatusText}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  HAL Level Intercept • Background Reminders Active
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic(20);
                onOpenLiveVoice();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FAAD3F] to-[#F38020] text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Radio size={14} className="animate-pulse" />
              <span>Live Voice</span>
            </button>
          </div>

          {/* Quick Hardware & Intent Shortcut Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            <button
              onClick={handleToggleTorch}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                torchActive
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(250,173,63,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-amber-400/40'
              }`}
            >
              <Flashlight size={20} className={torchActive ? 'animate-bounce text-amber-400' : ''} />
              <div className="text-center">
                <span className="text-[11px] font-bold block">Flashlight</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  {torchActive ? 'Hardware ON' : 'Toggle'}
                </span>
              </div>
            </button>

            <button
              onClick={() => handleQuickTimer(60, '1-Minute Focus')}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/40 text-slate-300 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Clock size={20} className="text-emerald-400" />
              <div className="text-center">
                <span className="text-[11px] font-bold block">1 Min Timer</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Instant Alert</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickTimer(300, '5-Minute Break')}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400/40 text-slate-300 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Bell size={20} className="text-blue-400" />
              <div className="text-center">
                <span className="text-[11px] font-bold block">5 Min Reminder</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Voice Notification</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickVoiceAction("Battery health and neural hardware diagnostics report: All system modules operational.")}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 text-slate-300 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Zap size={20} className="text-purple-400" />
              <div className="text-center">
                <span className="text-[11px] font-bold block">Diagnostics</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Hardware Check</span>
              </div>
            </button>
          </div>

          {/* Active Countdown Timers list */}
          {activeTimers.length > 0 && (
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                Active Hardware Timers ({activeTimers.length})
              </span>
              <div className="space-y-1.5">
                {activeTimers.map((timer) => (
                  <div
                    key={timer.id}
                    className="p-3 rounded-xl bg-white/5 border border-emerald-500/30 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-emerald-400 animate-spin" />
                      <span className="text-white font-sans font-medium">{timer.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-300">
                        {Math.floor(timer.remainingSeconds / 60)}:
                        {String(timer.remainingSeconds % 60).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => androidAssistantService.cancelTimer(timer.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Command Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
            {[
              "Remind me in 10 seconds",
              "What's market sentiment?",
              "Read task reminders",
              "Turn on flashlight"
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickVoiceAction(p)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 whitespace-nowrap font-medium transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
