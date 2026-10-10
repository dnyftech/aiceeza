import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code2, BrainCircuit, Mic, Layers, ArrowUpRight, Zap, CheckCircle2, Terminal, Globe, FolderKanban } from 'lucide-react';
import { ModelMode } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface ChatPlaceholderProps {
  userName?: string;
  onSelectPrompt: (promptText: string, options?: { mode?: ModelMode; image?: File; enableSearchGrounding?: boolean }) => void;
  onLiveToggle: () => void;
  onOpenCeezaVoice: () => void;
  onOpenAssistantTasks: () => void;
  mode: ModelMode;
  onToggleThinking: () => void;
  isSearchGrounding?: boolean;
  onToggleSearchGrounding?: () => void;
  onOpenArtifacts?: () => void;
  onOpenWorkspaces?: () => void;
}

const TEMPLATE_PROMPTS = [
  {
    id: 'search_grounding',
    icon: <Globe className="text-[#38bdf8]" size={20} />,
    title: 'Real-Time Search Grounding',
    subtitle: 'Fetch live real-world news, verified web citations, and fresh market/tech developments.',
    prompt: 'What are the most significant developments in AI, technology, and engineering happening this week? Ground your answer with verified live web sources and citations.',
    tag: 'Web Intelligence',
    enableSearchGrounding: true
  },
  {
    id: 'reasoning',
    icon: <BrainCircuit className="text-[#A142F4]" size={20} />,
    title: 'Deep Multi-Step Reasoning',
    subtitle: 'Break down complex algorithmic trade-offs and mathematical proofs step-by-step.',
    prompt: 'Apply deep multi-step thinking to analyze time and space complexity tradeoffs between Raft and Paxos consensus algorithms under high network partitioning.',
    tag: 'Deep Cortex',
    mode: ModelMode.Thinking
  },
  {
    id: 'code',
    icon: <Code2 className="text-[#4285F4]" size={20} />,
    title: 'Code & System Architecture',
    subtitle: 'Build a modular React TypeScript hook with error boundaries and clean state management.',
    prompt: 'Write a high-performance React TypeScript custom hook for handling real-time WebSocket state with reconnection backoff, error boundaries, and strict type safety.',
    tag: 'Engineering'
  },
  {
    id: 'trade',
    icon: <Sparkles className="text-[#FAAD3F]" size={20} />,
    title: 'Ceeza Intelligence & Strategy',
    subtitle: 'Get high-confidence, street-smart market insights and practical execution tactics.',
    prompt: 'Yo Ceeza! Give me a high-confidence, street-smart breakdown of modern software monetization and building high-leverage products.',
    tag: 'Caesar Mode'
  }
];

export const ChatPlaceholder: React.FC<ChatPlaceholderProps> = ({
  userName = 'Caesar',
  onSelectPrompt,
  onLiveToggle,
  onOpenCeezaVoice,
  onOpenAssistantTasks,
  mode,
  onToggleThinking,
  isSearchGrounding = true,
  onToggleSearchGrounding,
  onOpenArtifacts,
  onOpenWorkspaces,
}) => {
  const isThinking = mode === ModelMode.Thinking;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 py-3 sm:py-5 animate-in fade-in duration-500">
      
      {/* Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 mb-5 md:mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
          <Terminal size={13} className="text-[#FAAD3F]" />
          <span>GOD AI CEEZA · 99% INTELLIGENCE CORE</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Where would you like to begin,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAAD3F] to-[#F38020] font-medium">
            {userName}
          </span>
          ?
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-light leading-relaxed">
          Ask questions, analyze architectures, generate robust code, or initiate live audio sessions.
        </p>
      </motion.div>

      {/* Quick Interactive Mode Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-center gap-2 mb-5 sm:mb-6"
      >
        <button
          onClick={() => {
            triggerHaptic(15);
            onLiveToggle();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F38020]/10 hover:bg-[#F38020]/20 text-[#FAAD3F] border border-[#F38020]/30 text-xs font-mono font-medium transition-all"
        >
          <Mic size={13} className="text-[#FAAD3F]" />
          <span>Start Live Voice</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenCeezaVoice();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-medium transition-all"
        >
          <Zap size={13} className="text-[#4285F4]" />
          <span>Ceeza Audio DSP</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            if (onToggleSearchGrounding) onToggleSearchGrounding();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all border ${
            isSearchGrounding 
              ? 'bg-[#0284c7]/20 border-[#38bdf8] text-[#38bdf8] font-bold'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <Globe size={13} className={isSearchGrounding ? 'text-[#38bdf8]' : 'text-slate-400'} />
          <span>{isSearchGrounding ? 'Search Grounding: Active' : 'Enable Search Grounding'}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onToggleThinking();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all border ${
            isThinking 
              ? 'bg-[#4285F4]/20 border-[#4285F4] text-[#4285F4] font-bold'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <BrainCircuit size={13} className={isThinking ? 'text-[#4285F4] animate-pulse' : 'text-slate-400'} />
          <span>{isThinking ? 'Thinking Mode: Active' : 'Enable Thinking Mode'}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenAssistantTasks();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
        >
          <CheckCircle2 size={13} className="text-[#34A853]" />
          <span>Android Task Intents</span>
        </button>

        {onOpenArtifacts && (
          <button
            onClick={() => {
              triggerHaptic(15);
              onOpenArtifacts();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAAD3F]/10 hover:bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/30 text-xs font-mono font-medium transition-all"
          >
            <Layers size={13} className="text-[#FAAD3F]" />
            <span>Artifacts Sandbox</span>
          </button>
        )}

        {onOpenWorkspaces && (
          <button
            onClick={() => {
              triggerHaptic(15);
              onOpenWorkspaces();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
          >
            <FolderKanban size={13} className="text-[#38bdf8]" />
            <span>Workspaces & Notes</span>
          </button>
        )}
      </motion.div>

      {/* 2x2 Template Prompt Cards Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full"
      >
        {TEMPLATE_PROMPTS.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              triggerHaptic(20);
              onSelectPrompt(item.prompt, { 
                mode: item.mode, 
                enableSearchGrounding: item.enableSearchGrounding 
              });
            }}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#0c121e]/90 hover:bg-[#131b2e] border border-white/10 hover:border-[#FAAD3F]/40 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-black/60 text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white transition-colors">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {item.tag}
                  </span>
                  <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#FAAD3F]" />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-[#FAAD3F] transition-colors mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-2">
                {item.subtitle}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-300 font-mono">
              <span>Click to run template</span>
              <span className="text-[#FAAD3F] font-bold group-hover:underline">Start →</span>
            </div>
          </div>
        ))}
      </motion.div>

    </div>
  );
};
