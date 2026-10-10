import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Check, 
  Download, 
  Upload, 
  FileText, 
  Sparkles, 
  X, 
  ArrowRight,
  Terminal,
  Cpu,
  Save,
  Layers,
  Copy
} from 'lucide-react';
import { Workspace } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface WorkspaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSwitchWorkspace: (id: string) => void;
  onCreateWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => void;
  onDeleteWorkspace: (id: string) => void;
  onUpdateScratchpad: (workspaceId: string, scratchpad: string) => void;
  onSynthesizeScratchpadToArtifact?: (scratchpad: string) => void;
  onExportWorkspaces?: () => void;
  onImportWorkspaces?: (jsonStr: string) => void;
}

export const WorkspaceManagerModal: React.FC<WorkspaceManagerModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onUpdateScratchpad,
  onSynthesizeScratchpadToArtifact,
  onExportWorkspaces,
  onImportWorkspaces
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('⚡');
  const [newDesc, setNewDesc] = useState('');
  const [newEngine, setNewEngine] = useState('Gemini 3.8 Flash');

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const [scratchpadText, setScratchpadText] = useState(activeWorkspace?.scratchpad || '');
  const [hasSavedNotes, setHasSavedNotes] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Sync scratchpad text when active workspace changes
  React.useEffect(() => {
    if (activeWorkspace) {
      setScratchpadText(activeWorkspace.scratchpad || '');
    }
  }, [activeWorkspace?.id]);

  const handleSaveNotes = () => {
    if (!activeWorkspace) return;
    triggerHaptic(20);
    onUpdateScratchpad(activeWorkspace.id, scratchpadText);
    setHasSavedNotes(true);
    setTimeout(() => setHasSavedNotes(false), 2000);
  };

  const handleCopyNotes = async () => {
    try {
      triggerHaptic(15);
      await navigator.clipboard.writeText(scratchpadText);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    triggerHaptic(20);
    onCreateWorkspace({
      name: newName.trim(),
      icon: newIcon,
      description: newDesc.trim() || 'Custom intelligent workflow environment.',
      scratchpad: `# ${newName.trim()} Notes\n\nInitialized on ${new Date().toLocaleDateString()}`,
      activeEngine: newEngine,
      tags: ['Custom', 'Cross-Device']
    });
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImportWorkspaces) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          triggerHaptic(20);
          onImportWorkspaces(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl bg-[#090f1d] border border-[#FAAD3F]/40 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#121c33] via-[#0f172a] to-[#0d1424] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAAD3F]/15 border border-[#FAAD3F]/30 flex items-center justify-center text-[#FAAD3F] shadow-lg">
              <FolderKanban size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display italic text-white">
                  Intelligent Workspaces
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 font-bold">
                  {workspaces.length} Environments
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-device workspace synchronization, persistent project scratchpads & scoped engine configs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic(15);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs font-mono transition-all hover:brightness-110 shadow-md cursor-pointer"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Workspace</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Workspace Body: Left Switcher + Right Scratchpad */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Workspaces List (Left) */}
          <div className="w-full md:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#060a14] p-3 space-y-2 overflow-y-auto">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Active Projects & Scopes
              </span>
            </div>

            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    triggerHaptic(15);
                    onSwitchWorkspace(ws.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#131f38] border-[#FAAD3F]/70 text-white shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ws.icon}</span>
                      <span className="text-xs font-bold text-white font-mono">{ws.name}</span>
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <Check size={10} /> Active
                      </span>
                    ) : (
                      workspaces.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic(15);
                            onDeleteWorkspace(ws.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 text-slate-500 transition-opacity"
                          title="Delete workspace"
                        >
                          <Trash2 size={12} />
                        </button>
                      )
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {ws.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-white/5">
                    <span className="text-[#38bdf8]">{ws.activeEngine}</span>
                    <span className="text-slate-500">Cross-Device Ready</span>
                  </div>
                </div>
              );
            })}

            {/* Cross-Device Export & Import Actions */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block px-1">
                Cross-Device Data Bridge
              </span>
              <div className="grid grid-cols-2 gap-2">
                {onExportWorkspaces && (
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      onExportWorkspaces();
                    }}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono transition-all"
                    title="Export all workspaces & notes to JSON"
                  >
                    <Download size={13} />
                    <span>Backup</span>
                  </button>
                )}
                {onImportWorkspaces && (
                  <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono transition-all cursor-pointer">
                    <Upload size={13} />
                    <span>Restore</span>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Scratchpad & Copilot (Right) */}
          {activeWorkspace && (
            <div className="flex-1 min-h-0 flex flex-col bg-[#070c17]">
              
              {/* Scratchpad Header */}
              <div className="px-5 py-3 border-b border-white/10 bg-[#0a1020] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#FAAD3F]" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {activeWorkspace.name} · Scratchpad & Notes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onSynthesizeScratchpadToArtifact && scratchpadText.trim() && (
                    <button
                      onClick={() => {
                        triggerHaptic(20);
                        onSynthesizeScratchpadToArtifact(scratchpadText);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAAD3F]/20 hover:bg-[#FAAD3F]/30 border border-[#FAAD3F]/50 text-[#FAAD3F] text-xs font-mono font-bold transition-all"
                      title="Convert scratchpad notes into a permanent executable Artifact"
                    >
                      <Sparkles size={13} />
                      <span className="hidden sm:inline">Synthesize to Artifact</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyNotes}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                    title="Copy scratchpad notes"
                  >
                    {copiedNotes ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={handleSaveNotes}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs font-mono transition-all hover:brightness-110 shadow-md cursor-pointer"
                    title="Save scratchpad notes"
                  >
                    {hasSavedNotes ? <Check size={14} /> : <Save size={14} />}
                    <span>{hasSavedNotes ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Markdown Scratchpad Editor */}
              <div className="flex-1 min-h-0 p-4">
                <textarea
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Type architectural thoughts, notes, sprint checklists, or prompt drafts here... Automatically backed up."
                  className="w-full h-full bg-[#050812] border border-white/10 rounded-2xl p-4 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed outline-none focus:border-[#FAAD3F]/60 resize-none transition-colors"
                />
              </div>

              {/* Scratchpad Telemetry Bar */}
              <div className="px-5 py-2 border-t border-white/10 bg-[#0a1020] flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span>{scratchpadText.length} characters</span>
                  <span>·</span>
                  <span>{scratchpadText.split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <div>
                  <span className="text-emerald-400">● LocalStorage Synced</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </motion.div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-[#FAAD3F]/50 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white font-display italic">
                  Create New Workspace
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Workspace Name & Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-12 text-center py-2 rounded-xl bg-black/50 border border-white/10 text-lg outline-none text-white"
                    />
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Android Core System"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#FAAD3F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short summary of project objectives..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#FAAD3F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Default Engine Preset
                  </label>
                  <select
                    value={newEngine}
                    onChange={(e) => setNewEngine(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="Gemini 3.8 Flash">Gemini 3.8 Flash (High Intelligence)</option>
                    <option value="Gemini 3.8 Flash-Lite">Gemini 3.8 Flash-Lite (Low Latency)</option>
                    <option value="Thinking Cortex">Thinking Cortex (Deep Reasoning Budget)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FAAD3F] hover:brightness-110 text-black font-bold text-xs font-mono shadow-lg"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
