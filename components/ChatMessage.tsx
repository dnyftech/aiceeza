import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Sender } from '../types';
import { User, Sparkles, BrainCircuit, ThumbsUp, ThumbsDown, Maximize2, ChevronDown, ChevronUp, Clock, GitCommit, Copy, Check, Volume2, VolumeX, Mic, Globe, ExternalLink, Search, Smile, Bookmark, Flag, Layers } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ChatMessageProps {
  message: Message;
  onRate?: (id: string, rating: 'up' | 'down') => void;
  onImageClick?: (src: string) => void;
  onPlayTTS?: (text: string) => void;
  onStopTTS?: () => void;
  isSpeaking?: boolean;
  onReact?: (id: string, emoji: string) => void;
  onToggleSave?: (id: string) => void;
  onOpenInArtifacts?: (text: string) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '💡', '🎯', '🚀', '⭐', '🔖', '🚩', '📌', '👏', '🤔'];

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRate, 
  onImageClick,
  onPlayTTS,
  onStopTTS,
  isSpeaking = false,
  onReact,
  onToggleSave,
  onOpenInArtifacts,
}) => {
  const isUser = message.sender === Sender.User;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReasoningChain, setShowReasoningChain] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const LONG_TEXT_THRESHOLD = 500;
  const isLongText = message.text && message.text.length > LONG_TEXT_THRESHOLD;
  
  const displayedText = isLongText && !isExpanded 
    ? `${message.text.slice(0, LONG_TEXT_THRESHOLD)}...` 
    : message.text;

  const toggleExpand = () => {
    triggerHaptic(15);
    setIsExpanded(prev => !prev);
  };

  const toggleReasoning = () => {
    triggerHaptic(15);
    setShowReasoningChain(prev => !prev);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      triggerHaptic(20);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const isThisMessageSpeaking = isSpeaking || isPlayingTTS;

  const handleSpeech = () => {
    triggerHaptic(20);
    if (isThisMessageSpeaking && onStopTTS) {
      setIsPlayingTTS(false);
      onStopTTS();
    } else if (onPlayTTS && message.text) {
      setIsPlayingTTS(true);
      onPlayTTS(message.text);
      // fallback reset after reasonable time
      setTimeout(() => setIsPlayingTTS(false), 8000);
    }
  };

  const dateObj = message.timestamp ? (message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)) : new Date();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const reasoningSteps = message.reasoningSteps || [
    "Phase 1: Parse user intent, contextual constraints, and parameters.",
    "Phase 2: Allocate thinking budget within Gemini 3.6 Neural Cortex engine.",
    "Phase 3: Deep evaluation of trade intelligence and architectural consistency.",
    "Phase 4: Synthesize high-confidence response with zero fluff."
  ];

  const groundingSources = message.groundingMetadata?.sources || [];
  const searchQueries = message.groundingMetadata?.searchQueries || [];
  const visibleSources = showAllSources ? groundingSources : groundingSources.slice(0, 4);
  const hasHiddenSources = groundingSources.length > 4;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-5 px-1`}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border text-xs ${
          isUser 
            ? 'bg-[#182338] border-white/10 text-[#FAAD3F]' 
            : 'bg-gradient-to-br from-[#F38020] to-[#FAAD3F] border-[#F38020] text-black font-bold'
        }`}>
          {isUser ? <User size={15} /> : <Sparkles size={15} />}
        </div>

        {/* Bubble & Actions */}
        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
          
          {/* Main Bubble */}
          <div className={`px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-lg transition-all duration-200 text-sm leading-relaxed ${
            isUser 
              ? 'bg-[#1e293b] text-white border border-white/15 rounded-tr-sm' 
              : 'bg-[#0f1726]/90 text-slate-100 border border-white/10 rounded-tl-sm'
          }`}>
            
            {/* Search Grounding Header & Live Web Sources */}
            {message.groundingMetadata && (searchQueries.length > 0 || groundingSources.length > 0) && (
              <div className="mb-3.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#0369a1]/20 via-[#0284c7]/10 to-transparent border border-[#38bdf8]/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-[#38bdf8]/20 text-[#38bdf8]">
                      <Globe size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold">
                        Search Grounding · Live Web Sources
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                    {groundingSources.length} Verified {groundingSources.length === 1 ? 'Source' : 'Sources'}
                  </span>
                </div>

                {/* Executed Web Search Queries */}
                {searchQueries.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Search size={11} className="text-[#38bdf8]" /> Searched:
                    </span>
                    {searchQueries.map((query, qIdx) => (
                      <span
                        key={qIdx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[10px] font-mono text-slate-300"
                      >
                        "{query}"
                      </span>
                    ))}
                  </div>
                )}

                {/* Grounding Source Citation Cards */}
                {groundingSources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visibleSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic(15)}
                          className="group flex items-start justify-between gap-2 p-2 rounded-lg bg-black/60 hover:bg-[#0c1f38] border border-white/10 hover:border-[#38bdf8]/50 transition-all text-left cursor-pointer"
                          title={source.url}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] flex-shrink-0" />
                              <span className="text-[10px] font-mono uppercase font-bold text-[#38bdf8] truncate">
                                {source.domain || 'web'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-200 line-clamp-1 group-hover:text-white group-hover:underline">
                              {source.title}
                            </p>
                          </div>
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-[#38bdf8] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                        </a>
                      ))}
                    </div>

                    {hasHiddenSources && (
                      <button
                        onClick={() => {
                          triggerHaptic(10);
                          setShowAllSources(prev => !prev);
                        }}
                        className="text-[10px] font-mono text-[#38bdf8] hover:underline flex items-center gap-1 mt-1 pt-1"
                      >
                        <span>{showAllSources ? 'Show fewer sources' : `+ View ${groundingSources.length - 4} more sources`}</span>
                        {showAllSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thinking / Reasoning Chain Header */}
            {message.isThinking && (
              <div className="mb-3.5 p-3 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={15} className="text-[#4285F4] animate-pulse" />
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-widest text-[#4285F4] font-bold">
                        Thought Process
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={toggleReasoning}
                    className="px-2.5 py-1 rounded-lg bg-[#4285F4]/20 hover:bg-[#4285F4]/30 border border-[#4285F4]/30 text-[#4285F4] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <span>{showReasoningChain ? 'Hide Reasoning' : 'Show Reasoning'}</span>
                    {showReasoningChain ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                <AnimatePresence>
                  {showReasoningChain && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 border-t border-[#4285F4]/20 space-y-1.5 font-mono text-xs"
                    >
                      <div className="text-[10px] uppercase text-[#4285F4] tracking-widest font-bold mb-1 flex items-center gap-1">
                        <GitCommit size={12} /> Step-by-Step Logic Breakdown:
                      </div>
                      {reasoningSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-300 bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="w-4 h-4 rounded bg-[#4285F4]/20 text-[#4285F4] font-bold flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed text-[11px]">
                            {step}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.map((att, idx) => (
              <div key={idx} className="mb-3 overflow-hidden rounded-xl border border-white/15 relative group">
                {att.type === 'image' && (
                  <div 
                    onClick={() => {
                      triggerHaptic(20);
                      if (onImageClick) onImageClick(att.data);
                    }}
                    className="relative cursor-pointer overflow-hidden rounded-xl"
                  >
                    <img 
                      src={att.data} 
                      alt="attachment" 
                      className="w-full h-auto max-h-72 object-cover transition-transform duration-300 group-hover:scale-102" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs uppercase tracking-wider">
                      <Maximize2 size={15} className="text-[#FAAD3F]" />
                      <span>Click to preview</span>
                    </div>
                  </div>
                )}
                {att.type === 'audio' && (
                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#FAAD3F] font-bold">
                      <Mic size={13} className="text-[#FAAD3F] animate-pulse" />
                      <span>Ceeza Voice Audio Sample</span>
                    </div>
                    <audio 
                      controls 
                      src={att.data} 
                      className="w-full h-8 rounded-lg outline-none" 
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Text Message Content */}
            <div className="whitespace-pre-wrap leading-relaxed break-words font-sans text-sm sm:text-[15px]">
              {displayedText}
            </div>

            {/* Read More Toggle */}
            {isLongText && (
              <button
                onClick={toggleExpand}
                className="mt-2.5 flex items-center gap-1 text-xs font-mono text-[#FAAD3F] hover:underline"
              >
                <span>{isExpanded ? 'Show less' : 'Read full response'}</span>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            {/* Active Reactions Display */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5">
                {Object.entries(message.reactions).map(([emoji, count]) => {
                  const isUserReacted = message.userReactions?.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => {
                        triggerHaptic(15);
                        onReact?.(message.id, emoji);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-all border cursor-pointer ${
                        isUserReacted
                          ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] border-[#FAAD3F]/40 font-bold shadow-sm'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:border-white/25'
                      }`}
                      title={isUserReacted ? `You reacted with ${emoji} (Click to remove)` : `React with ${emoji}`}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px] font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Row below bubble */}
          <div className="flex items-center gap-3 px-1 text-xs text-slate-400">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              {formattedTime}
            </span>

            {/* Reactions & Actions */}
            <div className="flex items-center gap-2">
              {/* Emoji Reaction Trigger Popover */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setShowEmojiPicker(prev => !prev);
                  }}
                  className={`p-1 transition-colors ${showEmojiPicker ? 'text-[#FAAD3F]' : 'hover:text-white'}`}
                  title="Add reaction"
                >
                  <Smile size={13} />
                </button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 5 }}
                      className="absolute bottom-full left-0 mb-2 p-1.5 rounded-2xl bg-[#0f172a] border border-white/15 shadow-2xl flex items-center gap-1 z-30 backdrop-blur-xl max-w-[92vw] overflow-x-auto"
                    >
                      {EMOJI_OPTIONS.map((emo) => {
                        const isReacted = message.userReactions?.includes(emo);
                        return (
                          <button
                            key={emo}
                            onClick={() => {
                              triggerHaptic(15);
                              onReact?.(message.id, emo);
                              setShowEmojiPicker(false);
                            }}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-125 cursor-pointer flex-shrink-0 ${
                              isReacted ? 'bg-[#FAAD3F]/25 border border-[#FAAD3F]/40' : 'hover:bg-white/10'
                            }`}
                            title={`React ${emo}`}
                          >
                            {emo}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bookmark AI Response */}
              {!isUser && onToggleSave && (
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    onToggleSave(message.id);
                  }}
                  className={`p-1 transition-colors ${
                    message.isSaved 
                      ? 'text-[#FAAD3F]' 
                      : 'hover:text-[#FAAD3F]'
                  }`}
                  title={message.isSaved ? "Saved to Bookmarks (Click to remove)" : "Bookmark response for later review in Saved view"}
                >
                  <Bookmark size={13} className={message.isSaved ? "fill-[#FAAD3F]" : ""} />
                </button>
              )}

              {/* Flag AI Response for Later Review */}
              {!isUser && onReact && (
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    onReact(message.id, '🚩');
                  }}
                  className={`p-1 transition-colors ${
                    message.userReactions?.includes('🚩') || message.reactions?.['🚩']
                      ? 'text-rose-400' 
                      : 'hover:text-rose-400'
                  }`}
                  title={message.userReactions?.includes('🚩') ? "Flagged for review (Click to unflag)" : "Flag response for later review in Saved view"}
                >
                  <Flag size={13} className={message.userReactions?.includes('🚩') || message.reactions?.['🚩'] ? "fill-rose-400" : ""} />
                </button>
              )}

              {/* Actions for Bot Messages: Artifact Sandbox, Copy, TTS, Rating */}
              {!isUser && (
                <>
                  {message.text.includes('```') && onOpenInArtifacts && (
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        onOpenInArtifacts(message.text);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAAD3F]/15 hover:bg-[#FAAD3F]/25 text-[#FAAD3F] border border-[#FAAD3F]/30 text-[10px] font-mono font-bold transition-all cursor-pointer mr-1"
                      title="Open code block in live Artifacts Sandbox"
                    >
                      <Layers size={11} />
                      <span>Sandbox</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy message"
                  >
                    {hasCopied ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                        <Check size={12} /> Copied
                      </span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>

                  {onPlayTTS && (
                    <button
                      onClick={handleSpeech}
                      className={`p-1 transition-colors ${isThisMessageSpeaking ? 'text-[#FAAD3F]' : 'hover:text-white'}`}
                      title={isThisMessageSpeaking ? "Stop voice playback" : "Read response aloud"}
                    >
                      {isThisMessageSpeaking ? (
                        <VolumeX size={13} className="animate-pulse text-[#FAAD3F]" />
                      ) : (
                        <Volume2 size={13} />
                      )}
                    </button>
                  )}

                  {onRate && (
                    <>
                      <button
                        onClick={() => {
                          triggerHaptic(15);
                          onRate(message.id, 'up');
                        }}
                        className={`p-1 transition-colors ${message.feedback === 'up' ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
                        title="Good response"
                      >
                        <ThumbsUp size={12} fill={message.feedback === 'up' ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic(15);
                          onRate(message.id, 'down');
                        }}
                        className={`p-1 transition-colors ${message.feedback === 'down' ? 'text-red-400' : 'hover:text-red-400'}`}
                        title="Bad response"
                      >
                        <ThumbsDown size={12} fill={message.feedback === 'down' ? 'currentColor' : 'none'} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
