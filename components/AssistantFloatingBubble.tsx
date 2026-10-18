import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic, Volume2, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface AssistantFloatingBubbleProps {
  isOpen: boolean;
  onOpenAssistant: () => void;
  isListening?: boolean;
  isSpeaking?: boolean;
}

export const AssistantFloatingBubble: React.FC<AssistantFloatingBubbleProps> = ({
  isOpen,
  onOpenAssistant,
  isListening = false,
  isSpeaking = false,
}) => {
  if (isOpen) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      drag
      dragConstraints={{ left: -300, right: 300, top: -400, bottom: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        triggerHaptic(20);
        onOpenAssistant();
      }}
      className="fixed bottom-24 right-5 z-50 cursor-pointer touch-none select-none"
      title="Tap to launch GOD AI Android Assistant"
    >
      <div className="relative group">
        {/* Glow rings */}
        <div
          className={`absolute -inset-2 rounded-full blur-md opacity-70 transition-all duration-300 ${
            isSpeaking
              ? 'bg-[#FAAD3F] animate-ping opacity-90'
              : isListening
              ? 'bg-[#34A853] animate-pulse opacity-90'
              : 'bg-gradient-to-r from-[#FAAD3F] to-[#34A853] opacity-60 group-hover:opacity-100'
          }`}
        />

        {/* Bubble sphere */}
        <div className="relative w-14 h-14 rounded-full bg-slate-950/90 border border-amber-400/50 shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
          {/* Animated radar sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent animate-spin duration-1000" />

          {isSpeaking ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-[#FAAD3F] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-5 bg-[#FAAD3F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-[#FAAD3F] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : isListening ? (
            <Mic size={22} className="text-[#34A853] animate-pulse" />
          ) : (
            <div className="flex flex-col items-center">
              <Sparkles size={20} className="text-[#FAAD3F]" />
              <span className="text-[8px] font-mono font-black text-amber-300 uppercase tracking-tighter">
                GOD
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
