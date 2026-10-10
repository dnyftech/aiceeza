import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrbTheme } from '../types';

export type AIOrbStage = 'listening' | 'speaking' | 'thinking' | 'idle';

interface OrbProps {
  isActive?: boolean;
  size?: 'small' | 'large';
  isThinking?: boolean;
  stage?: AIOrbStage;
  theme?: OrbTheme;
}

const THEME_STYLES: Record<OrbTheme, {
  speakingGlow: string;
  thinkingGlow: string;
  listeningGlow: string;
  speakingBorder: string;
  thinkingBorder: string;
  listeningBorder: string;
  speakingPlasma: string;
  thinkingPlasma: string;
  listeningPlasma: string;
  sparkColors: [string, string, string];
}> = {
  classic: {
    speakingGlow: 'bg-gradient-to-r from-[#34A853]/60 via-[#FBBC05]/60 to-[#4285F4]/60',
    thinkingGlow: 'bg-gradient-to-r from-[#4285F4]/60 via-[#EA4335]/60 to-[#FBBC05]/60',
    listeningGlow: 'bg-gradient-to-r from-[#4285F4]/50 via-[#F38020]/50 to-[#FBBC05]/50',
    speakingBorder: 'border-[#34A853] shadow-[0_0_90px_rgba(52,168,83,0.85)]',
    thinkingBorder: 'border-[#4285F4] shadow-[0_0_75px_rgba(66,133,244,0.85)]',
    listeningBorder: 'border-[#4285F4]/60 shadow-[0_0_60px_rgba(66,133,244,0.5)]',
    speakingPlasma: 'bg-[radial-gradient(circle_at_center,_#34A853_0%,_#FBBC05_40%,_#4285F4_70%,_transparent_100%)]',
    thinkingPlasma: 'bg-[radial-gradient(circle_at_center,_#4285F4_0%,_#EA4335_40%,_#FBBC05_70%,_transparent_100%)]',
    listeningPlasma: 'bg-[radial-gradient(circle_at_center,_#4285F4_0%,_#F38020_45%,_#131b2e_80%,_transparent_100%)]',
    sparkColors: ['#34A853', '#FBBC05', '#FAAD3F'],
  },
  emerald: {
    speakingGlow: 'bg-gradient-to-r from-[#10B981]/60 via-[#34D399]/60 to-[#059669]/60',
    thinkingGlow: 'bg-gradient-to-r from-[#059669]/60 via-[#6EE7B7]/60 to-[#10B981]/60',
    listeningGlow: 'bg-gradient-to-r from-[#10B981]/50 via-[#047857]/50 to-[#34D399]/50',
    speakingBorder: 'border-[#10B981] shadow-[0_0_90px_rgba(16,185,129,0.85)]',
    thinkingBorder: 'border-[#34D399] shadow-[0_0_75px_rgba(52,211,153,0.85)]',
    listeningBorder: 'border-[#10B981]/60 shadow-[0_0_60px_rgba(16,185,129,0.5)]',
    speakingPlasma: 'bg-[radial-gradient(circle_at_center,_#10B981_0%,_#34D399_40%,_#047857_70%,_transparent_100%)]',
    thinkingPlasma: 'bg-[radial-gradient(circle_at_center,_#34D399_0%,_#059669_40%,_#A7F3D0_70%,_transparent_100%)]',
    listeningPlasma: 'bg-[radial-gradient(circle_at_center,_#10B981_0%,_#065F46_45%,_#064E3B_80%,_transparent_100%)]',
    sparkColors: ['#10B981', '#34D399', '#6EE7B7'],
  },
  nebula: {
    speakingGlow: 'bg-gradient-to-r from-[#8B5CF6]/60 via-[#EC4899]/60 to-[#C084FC]/60',
    thinkingGlow: 'bg-gradient-to-r from-[#C084FC]/60 via-[#F43F5E]/60 to-[#8B5CF6]/60',
    listeningGlow: 'bg-gradient-to-r from-[#8B5CF6]/50 via-[#6366F1]/50 to-[#EC4899]/50',
    speakingBorder: 'border-[#EC4899] shadow-[0_0_90px_rgba(236,72,153,0.85)]',
    thinkingBorder: 'border-[#8B5CF6] shadow-[0_0_75px_rgba(139,92,246,0.85)]',
    listeningBorder: 'border-[#8B5CF6]/60 shadow-[0_0_60px_rgba(139,92,246,0.5)]',
    speakingPlasma: 'bg-[radial-gradient(circle_at_center,_#EC4899_0%,_#8B5CF6_40%,_#3B82F6_70%,_transparent_100%)]',
    thinkingPlasma: 'bg-[radial-gradient(circle_at_center,_#8B5CF6_0%,_#F43F5E_40%,_#C084FC_70%,_transparent_100%)]',
    listeningPlasma: 'bg-[radial-gradient(circle_at_center,_#8B5CF6_0%,_#4C1D95_45%,_#1E1B4B_80%,_transparent_100%)]',
    sparkColors: ['#EC4899', '#8B5CF6', '#C084FC'],
  },
  cyberpunk: {
    speakingGlow: 'bg-gradient-to-r from-[#06B6D4]/60 via-[#F43F5E]/60 to-[#F59E0B]/60',
    thinkingGlow: 'bg-gradient-to-r from-[#F43F5E]/60 via-[#10B981]/60 to-[#06B6D4]/60',
    listeningGlow: 'bg-gradient-to-r from-[#06B6D4]/50 via-[#F59E0B]/50 to-[#F43F5E]/50',
    speakingBorder: 'border-[#06B6D4] shadow-[0_0_90px_rgba(6,182,212,0.85)]',
    thinkingBorder: 'border-[#F43F5E] shadow-[0_0_75px_rgba(244,63,94,0.85)]',
    listeningBorder: 'border-[#06B6D4]/60 shadow-[0_0_60px_rgba(6,182,212,0.5)]',
    speakingPlasma: 'bg-[radial-gradient(circle_at_center,_#06B6D4_0%,_#F43F5E_40%,_#F59E0B_70%,_transparent_100%)]',
    thinkingPlasma: 'bg-[radial-gradient(circle_at_center,_#F43F5E_0%,_#06B6D4_40%,_#10B981_70%,_transparent_100%)]',
    listeningPlasma: 'bg-[radial-gradient(circle_at_center,_#06B6D4_0%,_#0891B2_45%,_#155E75_80%,_transparent_100%)]',
    sparkColors: ['#06B6D4', '#F43F5E', '#F59E0B'],
  },
};

export const IndicatingOrb: React.FC<{
  status?: 'live' | 'thinking' | 'speaking' | 'idle' | 'listening';
  size?: number;
  theme?: OrbTheme;
}> = ({ status = 'idle', size = 28, theme = 'classic' }) => {
  const isLive = status === 'live' || status === 'listening';
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking';
  const themeConfig = THEME_STYLES[theme] || THEME_STYLES.classic;

  return (
    <div 
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer Status Pulsing Quad-Gradient Ring */}
      <motion.div
        animate={{
          scale: isLive ? [1, 1.45, 1] : isSpeaking ? [1, 1.35, 1] : isThinking ? [1, 1.25, 1] : [1, 1.1, 1],
          opacity: isLive ? [0.6, 1, 0.6] : isSpeaking ? [0.7, 1, 0.7] : [0.3, 0.7, 0.3],
          rotate: isThinking ? [0, 180, 360] : 0
        }}
        transition={{
          duration: isLive ? 1.2 : isSpeaking ? 1.1 : isThinking ? 2.5 : 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 rounded-full blur-sm ${
          isSpeaking
            ? themeConfig.speakingGlow
            : isLive 
              ? themeConfig.listeningGlow
              : isThinking 
                ? themeConfig.thinkingGlow 
                : 'bg-gradient-to-r from-[#4285F4]/40 to-[#F38020]/40'
        }`}
      />

      {/* Orbiting Tech Ring for Thinking Mode */}
      {isThinking && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-1 rounded-full border border-dashed border-[#4285F4]"
        />
      )}

      {/* Gemini Spark Mini Core */}
      <div 
        className={`relative w-full h-full rounded-full border shadow-lg transition-all duration-300 flex items-center justify-center ${
          isSpeaking
            ? themeConfig.speakingBorder
            : isLive
              ? themeConfig.listeningBorder
              : isThinking
                ? themeConfig.thinkingBorder
                : 'bg-gradient-to-tr from-[#131b2e] via-[#1c263b] to-[#2a3854] border-[#F38020]/40 shadow-[0_0_10px_rgba(243,128,32,0.3)]'
        }`}
      >
        {/* Gemini 4-Pointed Sparkle Mini Icon */}
        <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 fill-white animate-pulse">
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>
    </div>
  );
};

export const Orb: React.FC<OrbProps> = ({ isActive = false, size = 'large', isThinking = false, stage, theme = 'classic' }) => {
  const isLarge = size === 'large';
  const containerClass = isLarge ? 'w-80 h-80' : 'w-24 h-24';
  const themeConfig = THEME_STYLES[theme] || THEME_STYLES.classic;

  // Determine effective stage
  const currentStage: AIOrbStage = stage || (
    isThinking ? 'thinking' : isActive ? 'speaking' : 'listening'
  );

  const isSpeaking = currentStage === 'speaking' || (isActive && !isThinking);
  const isListening = currentStage === 'listening' && !isSpeaking && !isThinking;
  const isThinkingMode = currentStage === 'thinking' || isThinking;

  return (
    <div className={`relative flex items-center justify-center ${containerClass}`}>
      
      {/* --- MULTICOLOR GEMINI AURA ATMOSPHERE --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage + theme}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.4 }}
          className={`absolute pointer-events-none z-0 flex items-center justify-center ${
            isLarge ? '-inset-12' : '-inset-4'
          }`}
        >
          {/* 1. Gemini Quad-Color Gradient Backlight Glow */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.05, 1],
              rotate: [0, 90, 180, 270, 360],
              opacity: isSpeaking ? [0.6, 0.95, 0.6] : isListening ? [0.5, 0.85, 0.5] : [0.3, 0.6, 0.3],
            }}
            transition={{
              scale: { duration: isSpeaking ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: isThinkingMode ? 8 : 20, repeat: Infinity, ease: "linear" },
              opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className={`absolute inset-0 rounded-full blur-3xl ${
              isSpeaking
                ? themeConfig.speakingGlow
                : isThinkingMode
                  ? themeConfig.thinkingGlow
                  : themeConfig.listeningGlow
            }`}
          />

          {/* 2. Concentric Acoustic Ripples for Listening / Vocal State */}
          {(isListening || isSpeaking) && (
            <>
              {[1.15, 1.35, 1.55].map((scaleFactor, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, scaleFactor, 1],
                    opacity: [0.7, 0, 0.7],
                  }}
                  transition={{
                    duration: isSpeaking ? 1.2 + i * 0.2 : 2.2 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 0.25
                  }}
                  className={`absolute inset-0 rounded-full border ${
                    isSpeaking 
                      ? 'border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                      : 'border-[#4285F4]/60 shadow-[0_0_20px_rgba(66,133,244,0.4)]'
                  }`}
                />
              ))}
            </>
          )}

          {/* 3. Orbiting Google Gemini Quad-Color Nodes for Thinking State */}
          {isThinkingMode && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-white/90 shadow-[0_0_30px_rgba(255,255,255,0.6)]"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-white/20"
              >
                {/* 4 Theme Color Satellites */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#FFFFFF]" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#EA4335] shadow-[0_0_20px_#EA4335]" />
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#34A853] shadow-[0_0_20px_#34A853]" />
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FBBC05] shadow-[0_0_20px_#FBBC05]" />
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- MAIN GEMINI LIQUID PLASMA ORB SPHERE --- */}
      <div className={`relative w-full h-full overflow-hidden rounded-full border-2 transition-all duration-500 z-10 flex items-center justify-center bg-black/90 ${
        isSpeaking 
          ? themeConfig.speakingBorder + ' scale-105'
          : isThinkingMode
            ? themeConfig.thinkingBorder
            : themeConfig.listeningBorder + ' scale-100'
      }`}>

        {/* Dynamic Fluid Plasma Core Background */}
        <motion.div
          animate={{
            rotate: [0, 180, 360],
            scale: isSpeaking ? [1, 1.12, 1] : [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: isSpeaking ? 6 : isThinkingMode ? 4 : 14, repeat: Infinity, ease: "linear" },
            scale: { duration: isSpeaking ? 0.35 : 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`absolute inset-0 rounded-full opacity-90 blur-xl ${
            isSpeaking
              ? themeConfig.speakingPlasma
              : isThinkingMode
                ? themeConfig.thinkingPlasma
                : themeConfig.listeningPlasma
          }`}
        />

        {/* Floating Gemini Plasma Mesh Wave */}
        <motion.div
          animate={{
            rotate: [360, 0],
            borderRadius: isSpeaking 
              ? ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 30% 50% 70% / 50% 60% 30% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
              : ["50%", "45% 55% 60% 40% / 50% 45% 55% 50%", "50%"],
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            borderRadius: { duration: isSpeaking ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-4 opacity-80 bg-gradient-to-tr from-[#4285F4]/40 via-[#FBBC05]/40 to-[#EA4335]/40 blur-md"
        />

        {/* --- CENTER GEMINI SPARK & LIP-SYNC VOICE SPECTRUM WAVE (Speaking Mode) --- */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          
          {/* Gemini 4-Pointed Sparkle Emblem */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.25, 0.95, 1.15, 1] : isThinkingMode ? [0.9, 1.15, 0.9] : [1, 1.06, 1],
              rotate: isThinkingMode ? [0, 90, 180, 270, 360] : 0,
            }}
            transition={{
              scale: { duration: isSpeaking ? 0.4 : 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 8, repeat: Infinity, ease: "linear" }
            }}
            className={`flex items-center justify-center ${isLarge ? 'w-24 h-24' : 'w-8 h-8'}`}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">
              <defs>
                <linearGradient id={`geminiGrad_${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor={themeConfig.sparkColors[0]} />
                  <stop offset="70%" stopColor={themeConfig.sparkColors[1]} />
                  <stop offset="100%" stopColor={themeConfig.sparkColors[2]} />
                </linearGradient>
              </defs>
              <path 
                fill={`url(#geminiGrad_${theme})`}
                d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" 
              />
            </svg>
          </motion.div>

          {/* --- LIP-SYNCING TTS RESPONSIVE SPECTRUM BARS --- */}
          {isSpeaking && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`flex items-center gap-1 mt-2 z-30 ${isLarge ? 'h-10' : 'h-4'}`}
            >
              {[14, 28, 42, 20, 38, 46, 26, 18].map((height, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isLarge 
                      ? [height * 0.4, height * 1.1, height * 0.3, height * 1.25, height * 0.5] 
                      : [height * 0.2, height * 0.5, height * 0.2, height * 0.6, height * 0.3],
                    opacity: [0.7, 1, 0.8, 1, 0.7]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.18 + (i * 0.04),
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                  className={`rounded-full bg-gradient-to-t from-white via-[#FBBC05] to-[#34A853] shadow-[0_0_12px_#34A853] ${
                    isLarge ? 'w-2' : 'w-1'
                  }`}
                />
              ))}
            </motion.div>
          )}

          {/* Status Text overlay for Large Orb */}
          {isLarge && (
            <motion.span 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] font-mono tracking-[0.25em] uppercase font-bold text-white/90 mt-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            >
              {isSpeaking ? 'TTS Lip-Sync Active' : isThinkingMode ? 'Thinking Neural Engine' : 'Listening...'}
            </motion.span>
          )}
        </div>

        {/* Subtle Inner Lens Vignette */}
        <div className="absolute inset-0 z-40 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
      </div>
    </div>
  );
};

export default Orb;
