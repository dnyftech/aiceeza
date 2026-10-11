import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic, Zap } from 'lucide-react';
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
  // If overlay is already open, hide floating bubble
  if (isOpen) return null;

  return (
    <motion.div
      drag
      dragConstraints={{ left: -300, right: 300, top: -500, bottom: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        triggerHaptic(25);
        onOpenAssistant();
      }}
      className="fixed bottom-24 right-4 z-[70] cursor-pointer touch-none select-none"
      title="Tap to summon Android Digital Assistant (Gemini / Ella Core)"
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsating outer aura */}
        <motion.div
          animate={{
            scale: isListening ? [1, 1.4, 1] : isSpeaking ? [1, 1.3, 1] : [1, 1.15, 1],
            opacity: isListening ? [0.6, 0.9, 0.6] : [0.3, 0.6, 0.3],
          }}
          transition={{ repeat: Infinity, duration: isListening ? 1.2 : 2.5 }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#4285F4] via-[#34A853] to-[#FAAD3F] blur-md absolute"
        />

        {/* Bubble Core */}
        <div className="w-13 h-13 rounded-full bg-black/90 border-2 border-[#34A853] shadow-2xl shadow-emerald-500/30 flex items-center justify-center relative z-10 backdrop-blur-md">
          {isListening ? (
            <Mic size={22} className="text-red-400 animate-pulse" />
          ) : isSpeaking ? (
            <Zap size={22} className="text-[#FAAD3F] animate-bounce" />
          ) : (
            <Sparkles size={22} className="text-[#34A853]" />
          )}

          {/* Miniature Android Assistant Badge */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#34A853] text-black text-[9px] font-bold flex items-center justify-center shadow">
            AI
          </div>
        </div>
      </div>
    </motion.div>
  );
};
