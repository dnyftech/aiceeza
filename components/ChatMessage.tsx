import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Sender } from '../types';
import { User, Sparkles, BrainCircuit, ThumbsUp, ThumbsDown, Maximize2, ChevronDown, ChevronUp, Clock, GitCommit, Copy, Check, Volume2, VolumeX, Mic } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ChatMessageProps {
  message: Message;
  onRate?: (id: string, rating: 'up' | 'down') => void;
  onImageClick?: (src: string) => void;
  onPlayTTS?: (text: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onRate, 
  onImageClick,
  onPlayTTS 
}) => {
  const isUser = message.sender === Sender.User;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReasoningChain, setShowReasoningChain] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

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

  const handleSpeech = () => {
    if (onPlayTTS && message.text) {
      triggerHaptic(20);
      setIsPlayingTTS(true);
      onPlayTTS(message.text);
      setTimeout(() => setIsPlayingTTS(false), 4000);
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
          </div>

          {/* Action Row below bubble */}
          <div className="flex items-center gap-3 px-1 text-xs text-slate-400">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              {formattedTime}
            </span>

            {/* Actions for Bot Messages: Copy, TTS, Rating */}
            {!isUser && (
              <div className="flex items-center gap-2">
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
                    className={`p-1 transition-colors ${isPlayingTTS ? 'text-[#FAAD3F]' : 'hover:text-white'}`}
                    title="Read response aloud"
                  >
                    <Volume2 size={13} className={isPlayingTTS ? 'animate-pulse' : ''} />
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
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
