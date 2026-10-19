import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BrainCircuit, 
  Image as ImageIcon, 
  Download, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Sparkles, 
  Code2, 
  MessageSquare, 
  Terminal, 
  CheckCircle2, 
  Smartphone, 
  Mic, 
  Bell, 
  FileText,
  SlidersHorizontal,
  Compass,
  ArrowRight
} from 'lucide-react';
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

type LayoutSection = 'all' | 'voice' | 'reasoning' | 'vision' | 'pwa';

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
  const [selectedSection, setSelectedSection] = useState<LayoutSection>('all');

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
      section: 'reasoning',
      icon: <Code2 className="text-[#38bdf8]" size={20} />,
      title: 'Architectural Audit',
      category: 'Google Infra',
      techMeta: 'Full-Stack Patterns',
      description: 'Analyze system design patterns, concurrency controls, and fault tolerance bounds.',
      prompt: 'Perform an architectural audit of system design patterns, concurrency controls, and high-performance algorithms.'
    },
    {
      id: 'logic',
      section: 'reasoning',
      icon: <Cpu className="text-[#a855f7]" size={20} />,
      title: 'Quantum & Distributed Logic',
      category: 'Deep Cortex',
      techMeta: 'Multi-Step Proof',
      description: 'Solve complex algorithmic bounds and state replication guarantees.',
      prompt: 'Apply step-by-step deep reasoning to analyze the complexity bounds and fault tolerance of distributed state systems.'
    },
    {
      id: 'vocal',
      section: 'voice',
      icon: <MessageSquare className="text-[#FAAD3F]" size={20} />,
      title: 'Talk to Ceeza (Caesar)',
      category: 'Caesar Mode',
      techMeta: 'Trade Smarts',
      description: 'Interact directly with high-leverage execution tactics and market strategy.',
      prompt: 'Yo Ceeza! Introduce yourself and break down how you interact with users with your trade style intelligence.'
    },
    {
      id: 'pwa',
      section: 'pwa',
      icon: <Terminal className="text-[#34d399]" size={20} />,
      title: 'Android PWA Offline Health',
      category: 'PWA v2.0',
      techMeta: 'Service Worker',
      description: 'Inspect offline cache manifests, background sync, and install status.',
      prompt: 'Summarize the PWA capabilities, offline caching strategies, and Android installation status of this app.'
    }
  ];

  const sections: { id: LayoutSection; label: string }[] = [
    { id: 'all', label: 'All Layouts' },
    { id: 'voice', label: 'Vocal DSP' },
    { id: 'reasoning', label: 'Cortex Reasoning' },
    { id: 'vision', label: 'Vision Multimodal' },
    { id: 'pwa', label: 'PWA & Mobile' },
  ];

  return (
    <div className="w-full space-y-4 px-1 pb-4 max-w-4xl mx-auto">
      
      {/* Layout Category Filter (Zero-Pill Segmented Control) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-[#FAAD3F]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
            Android UI Layout Templates
          </span>
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-black/40 border border-white/10 rounded-xl">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                triggerHaptic(10);
                setSelectedSection(s.id);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
                selectedSection === s.id
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- HERO ROW: LIVE VOCAL NEURAL LINK CARD --- */}
      {(selectedSection === 'all' || selectedSection === 'voice') && (
        <motion.div 
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            triggerHaptic(25);
            onLiveToggle();
          }}
          className="col-span-full relative overflow-hidden p-6 md:p-8 rounded-3xl border border-[#FAAD3F]/40 bg-[#090f1d] group cursor-pointer shadow-xl transition-all duration-300 hover:border-[#FAAD3F]"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-[#FAAD3F]/15 rounded-2xl text-[#FAAD3F] border border-[#FAAD3F]/30 shadow-lg">
                <Zap size={26} className={isLive ? "animate-pulse text-[#FAAD3F]" : "text-[#FAAD3F]"} />
              </div>
              <div>
                {/* Clean unboxed metadata with dot separators */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                  <span className="text-[#FAAD3F] font-bold">
                    {isLive ? 'Live Sync Active' : 'Neural Voice DSP'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Cloudflare Edge</span>
                  <span aria-hidden="true">·</span>
                  <span>Google Multimodal</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Bidirectional Vocal Link (CEEZA Engine)
                </h2>
                <p className="text-xs md:text-sm text-slate-300/80 mt-1 max-w-md leading-relaxed">
                  Real-time bidirectional speech synthesis operating at 24kHz with echo suppression and audio visualizer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-8 px-3 bg-black/50 rounded-xl border border-white/10">
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
                    className="w-1 bg-[#FAAD3F] rounded-full"
                  />
                ))}
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs uppercase tracking-wider font-mono shadow-md group-hover:brightness-110 transition-all">
                {isLive ? 'End Session' : 'Connect Voice'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- GRID ROW 1: CORTEX THOUGHT MATRIX & MULTIMODAL VISION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Cortex Thought Matrix Card */}
        {(selectedSection === 'all' || selectedSection === 'reasoning') && (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic(20);
              onToggleThinking();
            }}
            className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden ${
              isThinkingActive 
                ? 'border-[#a855f7]/60 shadow-xl bg-[#140e2b]' 
                : 'border-white/10 hover:border-[#a855f7]/40 bg-[#0a1020]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl border transition-colors ${
                isThinkingActive ? 'bg-[#a855f7]/20 text-[#c084fc] border-[#a855f7]/40' : 'bg-white/5 text-[#a855f7] border-white/10'
              }`}>
                <BrainCircuit size={22} />
              </div>
              
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className={isThinkingActive ? "text-[#c084fc] font-bold" : "text-slate-400"}>
                  {isThinkingActive ? 'Deep Cortex Active' : 'Thinking Cortex'}
                </span>
                <span aria-hidden="true">·</span>
                <span>32k Tokens</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Cortex Thought Matrix</h3>
                <Sparkles size={15} className="text-[#FAAD3F]" />
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Toggle multi-step deep reasoning for algorithm proofs, Byzantine invariants, and logic bounds.
              </p>
            </div>
          </motion.div>
        )}

        {/* Vision Multimodal Card */}
        {(selectedSection === 'all' || selectedSection === 'vision') && (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic(15);
              visionFileInputRef.current?.click();
            }}
            className="p-6 rounded-3xl border border-white/10 hover:border-[#38bdf8]/50 bg-[#0a1020] transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group shadow-lg"
          >
            <input 
              type="file" 
              ref={visionFileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleVisionFileChange}
            />

            <div className="flex justify-between items-start">
              <div className="p-3 bg-[#38bdf8]/15 rounded-2xl text-[#38bdf8] border border-[#38bdf8]/30 group-hover:bg-[#38bdf8]/25 transition-colors">
                <ImageIcon size={22} />
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-[#38bdf8] font-bold">Multimodal Vision</span>
                <span aria-hidden="true">·</span>
                <span>Attach File</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Vision Multimodal Perception</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload architecture schematics, UI wireframes, and optical diagrams for instant comprehension.
              </p>
            </div>
          </motion.div>
        )}

      </div>

      {/* --- GRID ROW 2: CEEZA VOICE INPUT & ANDROID ASSISTANT INTENT MATRIX --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ceeza Voice DSP Card */}
        {(selectedSection === 'all' || selectedSection === 'voice') && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic(25);
              if (onOpenCeezaVoice) onOpenCeezaVoice();
            }}
            className="p-6 rounded-3xl border border-[#FAAD3F]/40 hover:border-[#FAAD3F] bg-[#0c1322] transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden group shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[#FAAD3F]/15 rounded-2xl text-[#FAAD3F] border border-[#FAAD3F]/30 group-hover:bg-[#FAAD3F]/25 transition-colors">
                <Mic size={22} className="animate-pulse" />
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-[#FAAD3F] font-bold">CEEZA DSP</span>
                <span aria-hidden="true">·</span>
                <span>24kHz Audio</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Ceeza Vocal Audio DSP
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Interactive real-time audio modal with dynamic visualizer and dual-gain echo cancellation.
              </p>
            </div>
          </motion.div>
        )}

        {/* Android Task & Intent Matrix Card */}
        {(selectedSection === 'all' || selectedSection === 'pwa') && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic(20);
              if (onOpenAndroidAssistant) onOpenAndroidAssistant();
            }}
            className="p-6 rounded-3xl border border-[#34d399]/40 hover:border-[#34d399] bg-[#0c1322] transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden group shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[#34d399]/15 rounded-2xl text-[#34d399] border border-[#34d399]/30 group-hover:bg-[#34d399]/25 transition-colors">
                <Smartphone size={22} />
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-[#34d399] font-bold">Android Intents</span>
                <span aria-hidden="true">·</span>
                <span>Hardware Tasks</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Android Assistant Intents
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dispatch alarms, countdown timers, device flashlight triggers, and local task reminders.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* --- QUICK PROMPTS GRID --- */}
      <div className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts
            .filter((p) => selectedSection === 'all' || p.section === selectedSection)
            .map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  triggerHaptic(20);
                  onSelectPrompt(item.prompt);
                }}
                className="p-4 rounded-2xl bg-[#090f1e] border border-white/10 hover:border-[#FAAD3F]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between h-38 group shadow-lg text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#FAAD3F]">{item.techMeta}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-[#FAAD3F] transition-colors">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* --- PWA STATUS & NATIVE INSTALLER CARD --- */}
      {(selectedSection === 'all' || selectedSection === 'pwa') && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-3xl border border-white/10 bg-[#080d1a] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 shadow-xl"
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              {isOnline ? (
                <Wifi size={18} className="text-[#34d399] animate-pulse" />
              ) : (
                <WifiOff size={18} className="text-[#FAAD3F]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-bold text-white">Edge Runtime & Storage</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className={isOnline ? "text-[#34d399]" : "text-[#FAAD3F]"}>
                  {isOnline ? 'Online Sync' : 'Offline Cache'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {isStandalone 
                  ? 'Installed as Standalone Mobile Application' 
                  : canInstallPWA 
                    ? 'Ready to Install to Android App Drawer' 
                    : 'PWA Offline Cache Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isStandalone ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#34d399]/20 border border-[#34d399]/40 text-[#34d399] text-xs font-mono font-bold">
                <CheckCircle2 size={15} />
                <span>Installed</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic(30);
                  onInstallPWA();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAAD3F] text-black border border-[#FAAD3F]/40 transition-all text-xs font-mono font-bold tracking-wider active:scale-95 w-full sm:w-auto justify-center shadow-md hover:brightness-110"
              >
                <Download size={15} className="text-black" />
                <span>{canInstallPWA ? 'Install Android App' : 'PWA Guide'}</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
};
