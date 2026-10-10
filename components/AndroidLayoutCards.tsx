import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, BrainCircuit, Image as ImageIcon, Download, Wifi, WifiOff, Cpu, Sparkles, Code2, MessageSquare, Terminal, CheckCircle2, Smartphone, Mic, Bell, FileText } from 'lucide-react';
import { ModelMode } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface AndroidLayoutCardsProps {
  onLiveToggle: () => void;
  isLive: boolean;
  mode: ModelMode;
  onToggleThinking: () => void;
  onSelectPrompt: (promptText: string, image?: File) => void;
  isOnline: boolean;
  isStandalone: boolean;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  onOpenAndroidAssistant?: () => void;
  onOpenCeezaVoice?: () => void;
}

export const AndroidLayoutCards: React.FC<AndroidLayoutCardsProps> = ({
  onLiveToggle,
  isLive,
  mode,
  onToggleThinking,
  onSelectPrompt,
  isOnline,
  isStandalone,
  canInstallPWA,
  onInstallPWA,
  onOpenAndroidAssistant,
  onOpenCeezaVoice,
}) => {
  const visionFileInputRef = useRef<HTMLInputElement>(null);
  const isThinkingActive = mode === ModelMode.Thinking;

  const handleVisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerHaptic(20);
      const file = e.target.files[0];
      onSelectPrompt("Analyze this image for architectural details, object identification, and visual patterns.", file);
    }
  };

  const quickPrompts = [
    {
      id: 'arch',
      icon: <Code2 className="text-[#4285F4]" size={20} />,
      title: 'Architectural Audit',
      badge: 'Google Infra',
      badgeColor: 'bg-[#4285F4]/10 text-[#4285F4] border-[#4285F4]/30',
      description: 'Analyze full-stack system patterns & clean logic execution.',
      prompt: 'Perform an architectural audit of system design patterns, concurrency controls, and high-performance algorithms.'
    },
    {
      id: 'logic',
      icon: <Cpu className="text-[#EA4335]" size={20} />,
      title: 'Quantum Logic',
      badge: 'Deep Cortex',
      badgeColor: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/30',
      description: 'Solve complex math, logic, or algorithmic challenges.',
      prompt: 'Apply step-by-step deep reasoning to analyze the complexity bounds and fault tolerance of distributed state systems.'
    },
    {
      id: 'vocal',
      icon: <MessageSquare className="text-[#F38020]" size={20} />,
      title: 'Talk to Ceeza',
      badge: 'Caesar Mode',
      badgeColor: 'bg-[#F38020]/10 text-[#F38020] border-[#F38020]/30',
      description: 'Interact directly with Ceeza (Caesar) street smarts & high feature intelligence.',
      prompt: 'Yo Ceeza! Introduce yourself and break down how you interact with users with your trade style intelligence.'
    },
    {
      id: 'pwa',
      icon: <Terminal className="text-[#34A853]" size={20} />,
      title: 'Android PWA Check',
      badge: 'PWA v2.0',
      badgeColor: 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/30',
      description: 'Inspect PWA offline cache, manifest & mobile performance.',
      prompt: 'Summarize the PWA capabilities, offline caching strategies, and Android installation status of this app.'
    }
  ];

  return (
    <div className="w-full space-y-4 px-1 pb-4 max-w-4xl mx-auto">
      
      {/* --- HERO ROW: LIVE VOCAL NEURAL LINK CARD (Cloudflare + Google Theme) --- */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic(25);
          onLiveToggle();
        }}
        className="col-span-full relative overflow-hidden glass-dark p-6 md:p-8 rounded-[2.5rem] border border-[#F38020]/40 group cursor-pointer shadow-[0_15px_45px_rgba(243,128,32,0.15)] transition-all duration-300 hover:border-[#F38020]"
      >
        {/* Glow ambient background with Cloudflare Orange & Google Blue */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-[#F38020]/20 via-[#4285F4]/15 to-transparent rounded-full blur-3xl group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-[#F38020]/25 to-[#4285F4]/20 rounded-2xl text-[#F38020] border border-[#F38020]/40 shadow-[0_0_25px_rgba(243,128,32,0.3)]">
              <Zap size={28} className={isLive ? "animate-bounce text-[#FBBC05]" : "text-[#F38020]"} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-[#F38020]/20 border border-[#F38020]/40 rounded-full text-[10px] font-mono text-[#FAAD3F] uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F38020] animate-pulse" />
                  {isLive ? 'Live Sync Active' : 'Cloudflare Voice Link'}
                </span>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider hidden sm:inline">Google AI Multimodal</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-display italic tracking-tight text-white">
                Neural Voice (CEEZA Engine)
              </h2>
              <p className="text-xs md:text-sm text-slate-300/80 font-mono mt-1 max-w-md">
                Real-time bidirectional speech synthesis powered by Cloudflare edge runtime & Google Gemini voice models.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-8 px-3 bg-black/40 rounded-full border border-white/10">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isLive ? [8, 24, 12, 28, 10][i] : 6,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.4 + i * 0.1,
                    repeatType: "reverse"
                  }}
                  className="w-1 bg-[#F38020] rounded-full"
                />
              ))}
            </div>
            <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black font-bold text-xs uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(243,128,32,0.4)] group-hover:brightness-110 transition-colors">
              {isLive ? 'End Session' : 'Connect Voice'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* --- GRID ROW 1: CORTEX THOUGHT MATRIX & MULTIMODAL VISION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Cortex Thought Matrix Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic(20);
            onToggleThinking();
          }}
          className={`glass-dark p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer flex flex-col justify-between h-52 relative overflow-hidden ${
            isThinkingActive 
              ? 'border-[#4285F4]/60 shadow-[0_10px_35px_rgba(66,133,244,0.3)] bg-[#4285F4]/10' 
              : 'border-white/10 hover:border-[#4285F4]/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-3.5 rounded-2xl border transition-colors ${
              isThinkingActive ? 'bg-[#4285F4]/20 text-[#4285F4] border-[#4285F4]/40' : 'bg-white/5 text-[#4285F4] border-white/10'
            }`}>
              <BrainCircuit size={24} />
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border ${
              isThinkingActive 
                ? 'bg-[#4285F4]/30 text-blue-200 border-[#4285F4]/60 shadow-[0_0_12px_rgba(66,133,244,0.4)]' 
                : 'bg-white/5 text-white/60 border-white/10'
            }`}>
              {isThinkingActive ? 'Deep Cortex Active' : 'Google AI Pro'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-display italic text-white">Cortex Thought Matrix</h3>
              <Sparkles size={16} className="text-[#FBBC05]" />
            </div>
            <p className="text-xs text-slate-300/70 font-mono mt-1">
              Tap to toggle Google multi-step deep reasoning for complex algorithms & logic math.
            </p>
          </div>
        </motion.div>

        {/* Vision Multimodal Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic(15);
            visionFileInputRef.current?.click();
          }}
          className="glass-dark p-6 rounded-[2.5rem] border border-white/10 hover:border-[#34A853]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-52 relative overflow-hidden group"
        >
          <input 
            type="file" 
            ref={visionFileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleVisionFileChange}
          />

          <div className="flex justify-between items-start">
            <div className="p-3.5 bg-[#34A853]/15 rounded-2xl text-[#34A853] border border-[#34A853]/30 group-hover:bg-[#34A853]/25 transition-colors">
              <ImageIcon size={24} />
            </div>
            <div className="px-3 py-1 bg-[#34A853]/20 border border-[#34A853]/40 rounded-full text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold">
              Upload Image
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold font-display italic text-white">Vision Multimodal</h3>
            <p className="text-xs text-slate-300/70 font-mono mt-1">
              Tap to upload visual data, diagrams, UI layouts or photos directly from device.
            </p>
          </div>
        </motion.div>

      </div>

      {/* --- GRID ROW 2: CEEZA VOICE INPUT & ANDROID ASSISTANT INTENT MATRIX --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ceeza Voice DSP Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic(25);
            if (onOpenCeezaVoice) onOpenCeezaVoice();
          }}
          className="glass-dark p-6 rounded-[2.5rem] border border-[#FAAD3F]/40 hover:border-[#FAAD3F] transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div className="p-3.5 bg-[#FAAD3F]/15 rounded-2xl text-[#FAAD3F] border border-[#FAAD3F]/30 group-hover:bg-[#FAAD3F]/25 transition-colors">
              <Mic size={24} className="animate-pulse" />
            </div>
            <div className="px-3 py-1 bg-[#FAAD3F]/20 border border-[#FAAD3F]/40 rounded-full text-[10px] font-mono text-[#FAAD3F] uppercase tracking-widest font-bold">
              CEEZA Neural DSP
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold font-display italic text-white flex items-center gap-2">
              Ceeza Voice Input
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 not-italic">Direct Stream</span>
            </h3>
            <p className="text-xs text-slate-300/70 font-mono mt-1">
              Bypass browser speech recognition. Directly record with real-time FFT frequency metering & neural STT.
            </p>
          </div>
        </motion.div>

        {/* Android Assistant Intent Tasks Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic(25);
            if (onOpenAndroidAssistant) onOpenAndroidAssistant();
          }}
          className="glass-dark p-6 rounded-[2.5rem] border border-[#34A853]/40 hover:border-[#34A853] transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group shadow-lg"
        >
          <div className="flex justify-between items-start">
            <div className="p-3.5 bg-[#34A853]/15 rounded-2xl text-[#34A853] border border-[#34A853]/30 group-hover:bg-[#34A853]/25 transition-colors">
              <Smartphone size={24} className="text-[#34A853]" />
            </div>
            <div className="px-3 py-1 bg-[#34A853]/20 border border-[#34A853]/40 rounded-full text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold">
              Android Intent HAL
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold font-display italic text-white flex items-center gap-2">
              Assistant Task Intents
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 not-italic">Mobile Ready</span>
            </h3>
            <p className="text-xs text-slate-300/70 font-mono mt-1">
              Natural language intent interceptor for Android reminders, note keeping, app launch, and hardware tasks.
            </p>
          </div>
        </motion.div>
      </div>

      {/* --- GRID ROW 3: ANDROID QUICK LAUNCHER PROMPT RECIPES --- */}
      <div className="pt-2">
        <div className="flex items-center justify-between px-2 mb-3">
          <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-slate-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#F38020] via-[#4285F4] to-[#34A853]" />
            Android Quick Launcher Cards
          </h4>
          <span className="text-[10px] font-mono text-[#F38020] uppercase font-bold">Tap to Execute</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic(20);
                onSelectPrompt(item.prompt);
              }}
              className="glass-dark p-4 rounded-3xl border border-white/10 hover:border-[#F38020]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between h-40 group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#141b2b] rounded-xl border border-white/10 group-hover:bg-[#1c263b] transition-colors">
                  {item.icon}
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              <div>
                <h5 className="text-sm font-bold font-display italic text-white group-hover:text-[#FAAD3F] transition-colors">
                  {item.title}
                </h5>
                <p className="text-[11px] text-slate-300/70 line-clamp-2 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- GRID ROW 3: PWA STATUS & NATIVE ANDROID APP INSTALLER CARD --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-dark p-5 rounded-[2.5rem] border border-[#F38020]/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 shadow-xl"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#141b2b] border border-[#F38020]/30 flex items-center justify-center flex-shrink-0">
            {isOnline ? (
              <Wifi size={20} className="text-[#34A853] animate-pulse" />
            ) : (
              <WifiOff size={20} className="text-[#FBBC05]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Cloudflare Edge Runtime
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                isOnline 
                  ? 'bg-[#34A853]/20 text-[#34A853] border-[#34A853]/40' 
                  : 'bg-[#FBBC05]/20 text-[#FBBC05] border-[#FBBC05]/40'
              }`}>
                {isOnline ? 'Online Sync' : 'Offline Cache'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300/70 font-mono mt-0.5">
              {isStandalone 
                ? 'Installed as Standalone Mobile Application' 
                : canInstallPWA 
                  ? 'Ready to Install to Android App Drawer' 
                  : 'Cloudflare PWA Offline Cache v2.0 Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isStandalone ? (
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#34A853]/20 border border-[#34A853]/40 text-[#34A853] text-xs font-mono uppercase font-bold">
              <CheckCircle2 size={16} />
              App Installed
            </div>
          ) : (
            <button
              onClick={() => {
                triggerHaptic(30);
                onInstallPWA();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black border border-[#F38020]/40 transition-all text-xs font-mono uppercase font-bold tracking-wider active:scale-95 w-full sm:w-auto justify-center shadow-md hover:brightness-110"
            >
              <Download size={16} className="text-black" />
              {canInstallPWA ? 'Install Android App' : 'PWA App Guide'}
            </button>
          )}
        </div>
      </motion.div>

    </div>
  );
};
