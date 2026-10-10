import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Layers, 
  FolderKanban, 
  Cpu, 
  Smartphone, 
  Bookmark, 
  Mic, 
  Zap, 
  Globe, 
  BrainCircuit, 
  Trash2, 
  X,
  ArrowRight,
  Terminal,
  FileCode
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Tools' | 'Engines' | 'Actions';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArtifacts: () => void;
  onOpenWorkspaces: () => void;
  onOpenEngines: () => void;
  onOpenDeviceInspector: () => void;
  onOpenSaved: () => void;
  onOpenAndroidTasks: () => void;
  onOpenLiveVoice: () => void;
  onOpenCeezaVoice: () => void;
  onToggleThinking: () => void;
  onToggleSearchGrounding: () => void;
  onClearChat: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenArtifacts,
  onOpenWorkspaces,
  onOpenEngines,
  onOpenDeviceInspector,
  onOpenSaved,
  onOpenAndroidTasks,
  onOpenLiveVoice,
  onOpenCeezaVoice,
  onToggleThinking,
  onToggleSearchGrounding,
  onClearChat,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'artifacts',
      title: 'Open Artifacts Workbench',
      subtitle: 'Inspect live code sandboxes, SVG diagrams, and RFC specs',
      category: 'Navigation',
      icon: <Layers size={16} className="text-[#FAAD3F]" />,
      action: onOpenArtifacts,
      shortcut: 'Alt+A'
    },
    {
      id: 'workspaces',
      title: 'Intelligent Workspaces',
      subtitle: 'Switch project environments, manage scratchpad notes',
      category: 'Navigation',
      icon: <FolderKanban size={16} className="text-[#38bdf8]" />,
      action: onOpenWorkspaces,
      shortcut: 'Alt+W'
    },
    {
      id: 'engines',
      title: 'Internal Engines Matrix & Tuning',
      subtitle: 'Tune Thinking budget, temperature, telemetry & multi-engine health',
      category: 'Engines',
      icon: <Cpu size={16} className="text-[#a855f7]" />,
      action: onOpenEngines,
      shortcut: 'Alt+E'
    },
    {
      id: 'device',
      title: 'Cross-Device API Inspector',
      subtitle: 'Check device hardware, memory, battery, and Web APIs',
      category: 'Tools',
      icon: <Smartphone size={16} className="text-emerald-400" />,
      action: onOpenDeviceInspector,
      shortcut: 'Alt+D'
    },
    {
      id: 'live_voice',
      title: 'Start Live Vocal Session',
      subtitle: 'Launch real-time bidirectional Gemini Live streaming',
      category: 'Tools',
      icon: <Mic size={16} className="text-[#FAAD3F]" />,
      action: onOpenLiveVoice,
      shortcut: 'Alt+L'
    },
    {
      id: 'ceeza_dsp',
      title: 'Record Voice / Ceeza DSP',
      subtitle: 'Audio stream input with frequency level metering',
      category: 'Tools',
      icon: <Zap size={16} className="text-[#4285F4]" />,
      action: onOpenCeezaVoice,
    },
    {
      id: 'saved',
      title: 'Saved Intelligence & Bookmarks',
      subtitle: 'Review flagged AI answers, exported markdown, and ideas',
      category: 'Navigation',
      icon: <Bookmark size={16} className="text-[#FAAD3F]" />,
      action: onOpenSaved,
    },
    {
      id: 'android_tasks',
      title: 'Android Intent Tasks',
      subtitle: 'Manage local assistant reminders and app shortcuts',
      category: 'Tools',
      icon: <Smartphone size={16} className="text-[#34A853]" />,
      action: onOpenAndroidTasks,
    },
    {
      id: 'toggle_thinking',
      title: 'Toggle Thinking Cortex Mode',
      subtitle: 'Switch deep multi-step thinking budget on/off',
      category: 'Engines',
      icon: <BrainCircuit size={16} className="text-[#4285F4]" />,
      action: onToggleThinking,
    },
    {
      id: 'toggle_search',
      title: 'Toggle Google Search Grounding',
      subtitle: 'Enable or disable live web retrieval with inline sources',
      category: 'Engines',
      icon: <Globe size={16} className="text-[#38bdf8]" />,
      action: onToggleSearchGrounding,
    },
    {
      id: 'clear_chat',
      title: 'Clear Chat History',
      subtitle: 'Erase current session from browser storage',
      category: 'Actions',
      icon: <Trash2 size={16} className="text-red-400" />,
      action: onClearChat,
    }
  ];

  const filtered = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        triggerHaptic(20);
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl bg-[#0c1222] border border-[#FAAD3F]/40 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#080d19]">
          <Search size={18} className="text-[#FAAD3F] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or module name... (e.g. Artifacts, Engines, Workspaces)"
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm outline-none font-mono"
          />
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No matching modules or commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    triggerHaptic(20);
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#18233c] text-white border border-[#FAAD3F]/40 shadow-md'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono truncate text-white">
                          {cmd.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate leading-normal">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  {cmd.shortcut ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-slate-400 border border-white/10 flex-shrink-0">
                      {cmd.shortcut}
                    </span>
                  ) : (
                    <ArrowRight size={13} className="text-slate-500 flex-shrink-0 opacity-60" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-white/10 bg-[#080d19] flex items-center justify-between text-[10px] font-mono text-slate-500 flex-shrink-0">
          <span>Navigate with ↑ ↓ · Press Enter to execute</span>
          <span>Esc to exit</span>
        </div>
      </motion.div>
    </div>
  );
};
