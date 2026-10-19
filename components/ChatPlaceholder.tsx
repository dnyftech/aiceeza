import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Code2, 
  BrainCircuit, 
  Mic, 
  Layers, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  Terminal, 
  Globe, 
  FolderKanban,
  SlidersHorizontal,
  Compass,
  Cpu,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { ModelMode } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { PROMPT_UI_TEMPLATES, PromptUITemplate } from '../utils/uiTemplates';

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

type TemplateCategory = 'all' | 'engineering' | 'reasoning' | 'architecture' | 'audio' | 'mobile';

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
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: { id: TemplateCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Templates', icon: <Compass size={13} /> },
    { id: 'engineering', label: 'Code & Engineering', icon: <Code2 size={13} /> },
    { id: 'reasoning', label: 'Deep Reasoning', icon: <BrainCircuit size={13} /> },
    { id: 'architecture', label: 'Architecture & RFC', icon: <Layers size={13} /> },
    { id: 'audio', label: 'Vocal DSP', icon: <Zap size={13} /> },
    { id: 'mobile', label: 'Mobile & Intents', icon: <Smartphone size={13} /> },
  ];

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return PROMPT_UI_TEMPLATES;
    return PROMPT_UI_TEMPLATES.filter((t) => t.category === selectedCategory || (selectedCategory === 'all' && t.category === 'all'));
  }, [selectedCategory]);

  const handleCopyPrompt = async (e: React.MouseEvent, id: string, promptText: string) => {
    e.stopPropagation();
    try {
      triggerHaptic(10);
      await navigator.clipboard.writeText(promptText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const getTemplateIcon = (template: PromptUITemplate) => {
    switch (template.category) {
      case 'engineering':
        return <Code2 className="text-[#38bdf8]" size={18} />;
      case 'reasoning':
        return <BrainCircuit className="text-[#a855f7]" size={18} />;
      case 'architecture':
        return <Layers className="text-[#FAAD3F]" size={18} />;
      case 'audio':
        return <Zap className="text-[#F38020]" size={18} />;
      case 'mobile':
        return <Smartphone className="text-[#34d399]" size={18} />;
      default:
        return template.requiresGrounding 
          ? <Globe className="text-[#38bdf8]" size={18} />
          : <Sparkles className="text-[#FAAD3F]" size={18} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center px-4 py-4 sm:py-6 animate-in fade-in duration-500">
      
      {/* Editorial Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 mb-6"
      >
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-400">
          <Terminal size={13} className="text-[#FAAD3F]" />
          <span>GOD AI Orchestrator</span>
          <span aria-hidden="true">·</span>
          <span>Caesar Intelligence Core</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Where would you like to begin,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAAD3F] to-[#F38020] font-medium">
            {userName}
          </span>
          ?
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Select a production-ready UI template, inspect live architectures, test 24kHz audio DSP, or execute multimodal intents.
        </p>
      </motion.div>

      {/* Quick Access Action Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex flex-wrap items-center justify-center gap-2 mb-6"
      >
        <button
          onClick={() => {
            triggerHaptic(15);
            onLiveToggle();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FAAD3F]/10 hover:bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/30 text-xs font-mono font-medium transition-all"
        >
          <Mic size={13} />
          <span>Live Audio Voice</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenCeezaVoice();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-medium transition-all"
        >
          <Zap size={13} className="text-[#38bdf8]" />
          <span>Ceeza Vocal DSP</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            if (onToggleSearchGrounding) onToggleSearchGrounding();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
            isSearchGrounding 
              ? 'bg-[#0284c7]/20 border-[#38bdf8] text-[#38bdf8] font-bold'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <Globe size={13} className={isSearchGrounding ? 'text-[#38bdf8]' : 'text-slate-400'} />
          <span>{isSearchGrounding ? 'Search Grounding: On' : 'Search Grounding: Off'}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onToggleThinking();
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
            isThinking 
              ? 'bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc] font-bold'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
          }`}
        >
          <BrainCircuit size={13} className={isThinking ? 'text-[#c084fc] animate-pulse' : 'text-slate-400'} />
          <span>{isThinking ? 'Deep Thinking: Active' : 'Enable Deep Thinking'}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenAssistantTasks();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
        >
          <CheckCircle2 size={13} className="text-[#34d399]" />
          <span>Android Task Reminders</span>
        </button>

        {onOpenArtifacts && (
          <button
            onClick={() => {
              triggerHaptic(15);
              onOpenArtifacts();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
          >
            <Layers size={13} className="text-[#FAAD3F]" />
            <span>Artifacts Workbench</span>
          </button>
        )}

        {onOpenWorkspaces && (
          <button
            onClick={() => {
              triggerHaptic(15);
              onOpenWorkspaces();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
          >
            <FolderKanban size={13} className="text-[#38bdf8]" />
            <span>Workspaces</span>
          </button>
        )}
      </motion.div>

      {/* Refined Template Categories Filter (Zero-Pill Segmented Control) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="w-full mb-4"
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-[#FAAD3F]" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
              Curated UI Templates & Execution Blueprints
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none p-1 bg-black/40 border border-white/10 rounded-2xl">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic(10);
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 2-Column Refined UI Template Cards Grid */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full"
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                triggerHaptic(20);
                onSelectPrompt(item.prompt, { 
                  mode: item.requiresThinking ? ModelMode.Thinking : undefined, 
                  enableSearchGrounding: item.requiresGrounding 
                });
              }}
              className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#0b1220]/90 hover:bg-[#121b2d] border border-white/10 hover:border-[#FAAD3F]/40 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-black/60 text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                    {getTemplateIcon(item)}
                  </div>
                  
                  {/* Clean unboxed metadata with dot separators */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-slate-400">{item.categoryLabel}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono text-[10px] text-[#FAAD3F]">{item.engineMode}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-[#FAAD3F] transition-colors mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-300 font-mono">
                <button
                  type="button"
                  onClick={(e) => handleCopyPrompt(e, item.id, item.prompt)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  title="Copy prompt text"
                >
                  {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                </button>

                <span className="inline-flex items-center gap-1 text-[#FAAD3F] font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>Run Template</span>
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};
