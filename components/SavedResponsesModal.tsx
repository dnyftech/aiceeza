import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  X, 
  Search, 
  Copy, 
  Check, 
  Volume2, 
  ArrowRight, 
  Trash2, 
  Download, 
  BrainCircuit, 
  Globe, 
  MessageSquare,
  CheckSquare,
  Square,
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';
import { Message, Sender } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface SavedResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMessages: Message[];
  allMessages: Message[];
  onToggleSave: (id: string) => void;
  onBatchDeleteSaved?: (ids: string[]) => void;
  onReact: (id: string, emoji: string) => void;
  onPlayTTS?: (text: string) => void;
  onJumpToMessage: (id: string) => void;
}

export const SavedResponsesModal: React.FC<SavedResponsesModalProps> = ({
  isOpen,
  onClose,
  savedMessages,
  allMessages,
  onToggleSave,
  onBatchDeleteSaved,
  onReact,
  onPlayTTS,
  onJumpToMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSelection, setCopiedSelection] = useState(false);

  // --- Select Mode State ---
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Map to find the user prompt that preceded each AI response
  const promptMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < allMessages.length; i++) {
      const msg = allMessages[i];
      if (msg.sender === Sender.Bot && i > 0 && allMessages[i - 1].sender === Sender.User) {
        map.set(msg.id, allMessages[i - 1].text);
      }
    }
    return map;
  }, [allMessages]);

  const filteredMessages = useMemo(() => {
    return savedMessages.filter((msg) => {
      // Search text match
      const userPrompt = promptMap.get(msg.id) || '';
      const matchesSearch = searchQuery.trim() === '' || 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userPrompt.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter category
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'grounded') return !!msg.groundingMetadata;
      if (selectedFilter === 'thinking') return !!msg.isThinking;
      
      // Emoji filter
      if (msg.reactions && msg.reactions[selectedFilter] !== undefined) {
        return true;
      }
      if (msg.userReactions && msg.userReactions.includes(selectedFilter)) {
        return true;
      }

      return false;
    });
  }, [savedMessages, searchQuery, selectedFilter, promptMap]);

  // Toggle single item selection
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(12);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered items
  const handleSelectAllFiltered = () => {
    triggerHaptic(15);
    const allFilteredIds = filteredMessages.map((m) => m.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      // Deselect all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleCopySingle = async (msg: Message) => {
    try {
      triggerHaptic(15);
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Export all saved items as formatted Markdown
  const handleExportAll = async () => {
    if (savedMessages.length === 0) return;
    try {
      triggerHaptic(20);
      const exportContent = savedMessages
        .map((m, idx) => {
          const prompt = promptMap.get(m.id);
          const dateStr = new Date(m.timestamp).toLocaleString();
          return `### ${idx + 1}. Saved AI Response (${dateStr})\n${prompt ? `**Prompt:** ${prompt}\n\n` : ''}${m.text}\n\n---\n`;
        })
        .join('\n');

      await navigator.clipboard.writeText(exportContent);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (e) {
      console.error('Failed to export', e);
    }
  };

  // Export only currently selected items
  const handleExportSelected = async (format: 'markdown' | 'json' | 'download_md' | 'txt' | 'pdf' = 'markdown') => {
    if (selectedIds.size === 0) return;
    try {
      triggerHaptic(20);
      const itemsToExport = savedMessages.filter((m) => selectedIds.has(m.id));

      if (format === 'json') {
        const jsonContent = JSON.stringify(
          itemsToExport.map((m) => ({
            id: m.id,
            timestamp: m.timestamp,
            prompt: promptMap.get(m.id) || null,
            text: m.text,
            isThinking: m.isThinking,
            groundingSources: m.groundingMetadata?.sources || [],
          })),
          null,
          2
        );
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saved_ai_responses_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'txt') {
        const txtContent = `GOD AI - SAVED RESPONSES ARCHIVE\nExported: ${new Date().toLocaleString()}\nTotal Bookmarks: ${itemsToExport.length}\n${'='.repeat(60)}\n\n` +
          itemsToExport
            .map((m, idx) => {
              const prompt = promptMap.get(m.id);
              const dateStr = new Date(m.timestamp).toLocaleString();
              return `[#${idx + 1}] Date: ${dateStr}\n${prompt ? `PROMPT: ${prompt}\n\n` : ''}RESPONSE:\n${m.text}\n\n${'-'.repeat(60)}\n`;
            })
            .join('\n');
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saved_responses_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Generate formatted clean printable document and invoke browser Print/PDF engine
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const printableHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>GOD AI - Saved Responses (${itemsToExport.length} items)</title>
                <style>
                  @page { margin: 20mm; size: A4; }
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; line-height: 1.6; padding: 20px; font-size: 13px; }
                  header { border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
                  h1 { margin: 0; font-size: 22px; color: #ea580c; }
                  .meta { font-size: 11px; color: #666; font-family: monospace; }
                  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; background: #fafafa; }
                  .card-title { font-weight: bold; font-size: 12px; color: #64748b; font-family: monospace; margin-bottom: 6px; }
                  .prompt { background: #f1f5f9; border-left: 3px solid #f97316; padding: 8px 12px; margin-bottom: 12px; font-style: italic; border-radius: 4px; }
                  .response { white-space: pre-wrap; font-size: 13px; color: #1e293b; }
                  footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace; }
                </style>
              </head>
              <body>
                <header>
                  <div>
                    <h1>GOD AI · Saved Responses</h1>
                    <div class="meta">Exported on: ${new Date().toLocaleString()} · ${itemsToExport.length} selected items</div>
                  </div>
                </header>
                ${itemsToExport
                  .map((m, idx) => {
                    const prompt = promptMap.get(m.id);
                    const dateStr = new Date(m.timestamp).toLocaleString();
                    return `
                      <div class="card">
                        <div class="card-title">ITEM #${idx + 1} · ${dateStr}</div>
                        ${prompt ? `<div class="prompt"><strong>Prompt:</strong> ${prompt.replace(/</g, '&lt;')}</div>` : ''}
                        <div class="response">${m.text.replace(/</g, '&lt;')}</div>
                      </div>
                    `;
                  })
                  .join('')}
                <footer>GOD AI Neural Engine · Saved Intelligence Archive</footer>
                <script>
                  window.onload = function() {
                    window.print();
                  };
                </script>
              </body>
            </html>
          `;
          printWindow.document.open();
          printWindow.document.write(printableHtml);
          printWindow.document.close();
        }
      } else if (format === 'download_md') {
        const mdContent = `# Exported AI Responses (${itemsToExport.length} items)\nExported on: ${new Date().toLocaleString()}\n\n` +
          itemsToExport
            .map((m, idx) => {
              const prompt = promptMap.get(m.id);
              const dateStr = new Date(m.timestamp).toLocaleString();
              return `## ${idx + 1}. Response from ${dateStr}\n${prompt ? `> **User Prompt:** ${prompt}\n\n` : ''}${m.text}\n\n---\n`;
            })
            .join('\n');
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exported_responses_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Copy formatted Markdown to clipboard
        const mdContent = itemsToExport
          .map((m, idx) => {
            const prompt = promptMap.get(m.id);
            const dateStr = new Date(m.timestamp).toLocaleString();
            return `### ${idx + 1}. AI Response (${dateStr})\n${prompt ? `**Prompt:** ${prompt}\n\n` : ''}${m.text}\n\n---\n`;
          })
          .join('\n');
        await navigator.clipboard.writeText(mdContent);
        setCopiedSelection(true);
        setTimeout(() => setCopiedSelection(false), 2500);
      }
    } catch (e) {
      console.error('Failed to export selected', e);
    }
  };

  // Delete selected items
  const handleConfirmBatchDelete = () => {
    if (selectedIds.size === 0) return;
    triggerHaptic(30);
    const idsArray = Array.from(selectedIds);
    if (onBatchDeleteSaved) {
      onBatchDeleteSaved(idsArray);
    } else {
      // Fallback: toggle save each item
      idsArray.forEach((id) => onToggleSave(id));
    }
    setSelectedIds(new Set());
    setShowBatchDeleteConfirm(false);
    setIsSelectMode(false);
  };

  if (!isOpen) return null;

  const isAllFilteredSelected = 
    filteredMessages.length > 0 && 
    filteredMessages.every((m) => selectedIds.has(m.id));

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-[#0c1220] border border-[#FAAD3F]/40 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#182338] to-[#0f172a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAAD3F]/15 border border-[#FAAD3F]/30 flex items-center justify-center text-[#FAAD3F] shadow-lg">
                <Bookmark size={20} className="fill-[#FAAD3F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold font-display italic text-white">
                    Saved Intelligence
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 font-bold">
                    {savedMessages.length} {savedMessages.length === 1 ? 'Response' : 'Responses'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Bookmarked AI responses, key decisions, and flagged takeaways for review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Select Mode Toggle Button */}
              {savedMessages.length > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    const nextMode = !isSelectMode;
                    setIsSelectMode(nextMode);
                    if (!nextMode) {
                      setSelectedIds(new Set());
                      setShowBatchDeleteConfirm(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelectMode
                      ? 'bg-[#FAAD3F] text-black border-[#FAAD3F] shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle multi-select mode to batch delete or export"
                >
                  <CheckSquare size={14} />
                  <span>{isSelectMode ? 'Exit Select' : 'Select Mode'}</span>
                </button>
              )}

              {/* Quick Export All (when not in select mode) */}
              {!isSelectMode && savedMessages.length > 0 && (
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
                  title="Copy all saved responses as formatted Markdown"
                >
                  {copiedAll ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied All</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} className="text-[#FAAD3F]" />
                      <span className="hidden sm:inline">Export All</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Select Mode Sticky Action Banner */}
          <AnimatePresence>
            {isSelectMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#1e293b]/95 border-b border-[#FAAD3F]/30 px-4 py-2.5 flex items-center justify-between gap-3 overflow-hidden flex-wrap"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-200 hover:text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare size={14} className="text-[#FAAD3F]" />
                    ) : (
                      <Square size={14} className="text-slate-400" />
                    )}
                    <span>{isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}</span>
                  </button>

                  <span className="text-xs font-mono text-slate-300">
                    <span className="font-bold text-[#FAAD3F]">{selectedIds.size}</span> selected
                  </span>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Copy Selected Markdown */}
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => handleExportSelected('markdown')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'opacity-40 pointer-events-none text-slate-500'
                    }`}
                    title="Copy selected items as Markdown"
                  >
                    {copiedSelection ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-[#FAAD3F]" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>

                  {/* Download Selected Markdown File */}
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => handleExportSelected('download_md')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'opacity-40 pointer-events-none text-slate-500'
                    }`}
                    title="Download selected items as .md file"
                  >
                    <FileText size={13} className="text-sky-400" />
                    <span className="hidden sm:inline">.MD</span>
                  </button>

                  {/* Download Selected Plain TXT */}
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => handleExportSelected('txt')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'opacity-40 pointer-events-none text-slate-500'
                    }`}
                    title="Download selected items as plain text (.txt) file"
                  >
                    <Download size={13} className="text-amber-400" />
                    <span>TXT</span>
                  </button>

                  {/* Print / Save as PDF */}
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => handleExportSelected('pdf')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-[#ea580c]/20 hover:bg-[#ea580c]/30 text-orange-300 border border-[#ea580c]/40 font-bold'
                        : 'opacity-40 pointer-events-none text-slate-500'
                    }`}
                    title="Open formatted print-ready view to Save as PDF"
                  >
                    <FileText size={13} className="text-orange-400" />
                    <span>PDF</span>
                  </button>

                  {/* Download Selected JSON */}
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => handleExportSelected('json')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'opacity-40 pointer-events-none text-slate-500'
                    }`}
                    title="Export selected items as JSON format"
                  >
                    <Download size={13} className="text-emerald-400" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  {/* Batch Delete Confirmation / Trigger */}
                  {!showBatchDeleteConfirm ? (
                    <button
                      disabled={selectedIds.size === 0}
                      onClick={() => {
                        triggerHaptic(20);
                        setShowBatchDeleteConfirm(true);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        selectedIds.size > 0
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                          : 'opacity-40 pointer-events-none text-slate-500'
                      }`}
                      title="Delete all selected saved responses"
                    >
                      <Trash2 size={13} className="text-red-400" />
                      <span>Delete ({selectedIds.size})</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <button
                        onClick={handleConfirmBatchDelete}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-bold transition-all cursor-pointer shadow-lg"
                      >
                        <Trash2 size={13} />
                        <span>Confirm Delete</span>
                      </button>
                      <button
                        onClick={() => setShowBatchDeleteConfirm(false)}
                        className="px-2 py-1.5 rounded-lg text-xs font-mono bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-white/5 bg-black/40 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved responses or prompts..."
                className="w-full bg-[#131b2e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-[#FAAD3F]/60 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
              {[
                { id: 'all', label: 'All Saved' },
                { id: '🚩', label: '🚩 Flagged' },
                { id: '⭐', label: '⭐ Starred' },
                { id: '🔖', label: '🔖 Bookmarks' },
                { id: '💡', label: '💡 Ideas' },
                { id: '🔥', label: '🔥 Favorites' },
                { id: 'grounded', label: '🌐 Web Grounded' },
                { id: 'thinking', label: '🧠 Deep Thought' },
              ].map((tab) => {
                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerHaptic(15);
                      setSelectedFilter(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] border-[#FAAD3F]/50 font-bold shadow-sm'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-[#182338] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                  <Bookmark size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-300">
                  {savedMessages.length === 0 ? 'No Saved Responses Yet' : 'No Matching Saved Items'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {savedMessages.length === 0
                    ? 'To bookmark any AI answer, click the Bookmark icon (🔖) or react with ⭐ on any message in the chat.'
                    : 'Try clearing your search query or switching filters to view your other saved items.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-mono text-[#FAAD3F] hover:underline cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const prompt = promptMap.get(msg.id);
                const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
                const isSelected = selectedIds.has(msg.id);

                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={isSelectMode ? (e) => handleToggleSelect(msg.id, e) : undefined}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 relative group ${
                      isSelectMode ? 'cursor-pointer select-none' : ''
                    } ${
                      isSelected
                        ? 'bg-[#182338] border-[#FAAD3F] ring-1 ring-[#FAAD3F]/50 shadow-lg'
                        : 'bg-[#111827] border-white/10 hover:border-[#FAAD3F]/40'
                    }`}
                  >
                    {/* Card Meta & Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Select Mode Checkbox Indicator */}
                        {isSelectMode ? (
                          <div 
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#FAAD3F] text-black font-bold'
                                : 'bg-white/5 border border-white/20 text-transparent hover:border-[#FAAD3F]'
                            }`}
                          >
                            <Check size={14} className={isSelected ? 'text-black stroke-[3]' : 'opacity-0'} />
                          </div>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#FAAD3F]" />
                        )}

                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(msg.timestamp).toLocaleDateString()} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {msg.isThinking && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold uppercase flex items-center gap-1">
                            <BrainCircuit size={10} /> Thinking Mode
                          </span>
                        )}

                        {msg.groundingMetadata && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold uppercase flex items-center gap-1">
                            <Globe size={10} /> Search Grounded
                          </span>
                        )}
                      </div>

                      {/* Top Action Icons (hidden in select mode to encourage selection, or keep secondary) */}
                      {!isSelectMode && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopySingle(msg)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>

                          {onPlayTTS && (
                            <button
                              onClick={() => onPlayTTS(msg.text)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#FAAD3F] transition-colors cursor-pointer"
                              title="Play Voice Audio"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              triggerHaptic(20);
                              onJumpToMessage(msg.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#FAAD3F] transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                            title="View message in chat history"
                          >
                            <MessageSquare size={14} />
                            <span className="hidden sm:inline">Jump</span>
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic(20);
                              onToggleSave(msg.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove from saved bookmarks"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preceding User Prompt context if available */}
                    {prompt && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                        <span className="text-[10px] font-mono text-[#FAAD3F] uppercase font-bold block mb-0.5">
                          In response to prompt:
                        </span>
                        <p className="line-clamp-2 italic text-slate-200">"{prompt}"</p>
                      </div>
                    )}

                    {/* Full Response Text */}
                    <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans max-h-60 overflow-y-auto pr-1">
                      {msg.text}
                    </div>

                    {/* Reaction Bar & Quick Reactions on Saved Cards */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasReactions &&
                          Object.entries(msg.reactions!).map(([emoji, count]) => {
                            const isUserReacted = msg.userReactions?.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic(15);
                                  onReact(msg.id, emoji);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
                                  isUserReacted
                                    ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] border-[#FAAD3F]/40 font-bold'
                                    : 'bg-black/50 text-slate-300 border-white/10 hover:border-white/20'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-mono">{count}</span>
                              </button>
                            );
                          })}

                        {/* Quick React Picker for saved card */}
                        <div className="flex items-center gap-1 pl-1">
                          {['👍', '🔥', '💡', '⭐', '🔖'].map((emo) => {
                            const isUserReacted = msg.userReactions?.includes(emo);
                            return (
                              <button
                                key={emo}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic(15);
                                  onReact(msg.id, emo);
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-transform hover:scale-120 cursor-pointer ${
                                  isUserReacted ? 'bg-[#FAAD3F]/25 border border-[#FAAD3F]/40' : 'hover:bg-white/5'
                                }`}
                                title={`React ${emo}`}
                              >
                                {emo}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Jump to Chat direct button */}
                      {!isSelectMode && (
                        <button
                          onClick={() => {
                            triggerHaptic(20);
                            onJumpToMessage(msg.id);
                          }}
                          className="text-[11px] font-mono text-[#FAAD3F] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Open in Chat</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
