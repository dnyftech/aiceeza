import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Cpu, Sparkles, Terminal, Globe, Zap } from 'lucide-react';
import { OrbTheme } from '../types';

interface NeuralProcessingIndicatorProps {
  theme?: OrbTheme;
  isThinking?: boolean;
  isSearchGrounding?: boolean;
}

const STREAM_PHRASES = [
  'NEURAL_SYNAPSE::PARSING_INPUT_TOKENS',
  'DEEP_CORTEX::EVALUATING_SEMANTIC_WEIGHTS',
  'ATTENTION_MATRIX::COMPUTING_HEADS [0x7E3F]',
  'REASONING_ENGINE::SYNTHESIZING_RESPONSE',
  'TOKEN_VECTOR::DECODING_MULTIMODAL_STREAM',
  'NEURAL_NET::STREAMING_INFERENCE_OUTPUT',
];

const SEARCH_PHRASES = [
  'GOOGLE_SEARCH_GROUNDING::DISPATCHING_QUERY',
  'WEB_INTELLIGENCE::HARVESTING_REALTIME_CHUNKS',
  'SOURCE_VERIFICATION::EVALUATING_GROUNDING_NODES',
  'CITATIONS_INDEX::SYNTHESIZING_FACT_ANCHORS',
];

const THINKING_PHRASES = [
  'THINKING_BUDGET_32K::DELIBERATING_DEEP_REASONING',
  'NEURAL_CHAIN::VERIFYING_HYPOTHESIS_BRANCHES',
  'CORTEX_REASONING::EXPLORING_COUNTERFACTUALS',
  'SYNAPTIC_SYNTHESIS::FINALIZING_CHAIN_OF_THOUGHT',
];

export const NeuralProcessingIndicator: React.FC<NeuralProcessingIndicatorProps> = ({
  theme = 'classic',
  isThinking = false,
  isSearchGrounding = false,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [hexTokens, setHexTokens] = useState<string[]>(['0x8F', '0x4A', '0xC2', '0x1E']);

  // Dynamic phrase cycling
  useEffect(() => {
    const activePhrases = isThinking 
      ? THINKING_PHRASES 
      : isSearchGrounding 
        ? SEARCH_PHRASES 
        : STREAM_PHRASES;

    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % activePhrases.length);
      // Randomize hex tokens
      const randomHex = Array.from({ length: 4 }, () => 
        '0x' + Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')
      );
      setHexTokens(randomHex);
    }, 1800);

    return () => clearInterval(interval);
  }, [isThinking, isSearchGrounding]);

  const activePhrases = isThinking 
    ? THINKING_PHRASES 
    : isSearchGrounding 
      ? SEARCH_PHRASES 
      : STREAM_PHRASES;

  const currentPhrase = activePhrases[phraseIndex % activePhrases.length];

  // Theme-specific colors
  const themeColors = {
    classic: {
      accent: '#FAAD3F',
      accentGlow: 'rgba(250, 173, 63, 0.4)',
      gradient: 'from-[#F38020] via-[#FAAD3F] to-[#4285F4]',
      border: 'border-[#FAAD3F]/40',
      tagBg: 'bg-[#FAAD3F]/10',
      nodeColor: '#FAAD3F',
      lineColor: 'rgba(250, 173, 63, 0.5)',
      pulseBg: 'bg-[#FAAD3F]',
    },
    emerald: {
      accent: '#00F5A0',
      accentGlow: 'rgba(0, 245, 160, 0.4)',
      gradient: 'from-[#00F5A0] via-[#00D9F6] to-[#0052D4]',
      border: 'border-[#00F5A0]/40',
      tagBg: 'bg-[#00F5A0]/10',
      nodeColor: '#00F5A0',
      lineColor: 'rgba(0, 245, 160, 0.5)',
      pulseBg: 'bg-[#00F5A0]',
    },
    nebula: {
      accent: '#C084FC',
      accentGlow: 'rgba(192, 132, 252, 0.4)',
      gradient: 'from-[#B92B27] via-[#1565C0] to-[#8E2DE2]',
      border: 'border-[#C084FC]/40',
      tagBg: 'bg-[#C084FC]/10',
      nodeColor: '#C084FC',
      lineColor: 'rgba(192, 132, 252, 0.5)',
      pulseBg: 'bg-[#C084FC]',
    },
    cyberpunk: {
      accent: '#FF007F',
      accentGlow: 'rgba(255, 0, 127, 0.4)',
      gradient: 'from-[#FF007F] via-[#7928CA] to-[#00DFD8]',
      border: 'border-[#FF007F]/40',
      tagBg: 'bg-[#FF007F]/10',
      nodeColor: '#FF007F',
      lineColor: 'rgba(255, 0, 127, 0.5)',
      pulseBg: 'bg-[#FF007F]',
    },
  }[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className="flex justify-start mb-6 px-2 w-full max-w-2xl"
    >
      <div className={`relative overflow-hidden rounded-2xl rounded-tl-sm bg-[#0c1220]/90 border ${themeColors.border} backdrop-blur-xl shadow-2xl p-4 sm:p-5 w-full`}>
        
        {/* Ambient Top Glow Line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${themeColors.gradient} opacity-80`} />
        
        {/* Background Scanline Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Left: Pulsed Neural Node Animation + Status Info */}
          <div className="flex items-center gap-3.5">
            
            {/* Dynamic Pulsed Neural Node Visual */}
            <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
              {/* Ripple Ring 1 */}
              <motion.div
                animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                className={`absolute inset-0 rounded-full border border-dashed ${themeColors.border}`}
                style={{ borderColor: themeColors.accent }}
              />
              {/* Ripple Ring 2 */}
              <motion.div
                animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                className="absolute inset-1 rounded-full border"
                style={{ borderColor: themeColors.accent }}
              />

              {/* Pulsing Central Neural Core */}
              <motion.div
                animate={{ scale: [0.9, 1.15, 0.9], rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${themeColors.gradient} flex items-center justify-center shadow-lg`}
                style={{ boxShadow: `0 0 20px ${themeColors.accentGlow}` }}
              >
                <BrainCircuit size={16} className="text-black" />
              </motion.div>

              {/* Satellite Synaptic Nodes Orbiting */}
              {[0, 120, 240].map((deg, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ transformOrigin: 'center center' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_#fff]"
                    style={{
                      backgroundColor: themeColors.accent,
                      position: 'absolute',
                      top: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Neural Telemetry Titles */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${themeColors.pulseBg} animate-ping`} />
                  GOD AI Neural Processing
                </span>
                
                {isThinking && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase flex items-center gap-1">
                    <Zap size={9} />
                    Deep Reasoning
                  </span>
                )}
                
                {isSearchGrounding && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 font-bold uppercase flex items-center gap-1">
                    <Globe size={9} />
                    Search Grounding
                  </span>
                )}
              </div>

              {/* Animated Code-Stream Status Text */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                <Terminal size={12} style={{ color: themeColors.accent }} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentPhrase}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.25 }}
                    className="tracking-tight text-slate-200"
                  >
                    {currentPhrase}
                  </motion.span>
                </AnimatePresence>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="font-bold"
                  style={{ color: themeColors.accent }}
                >
                  ▌
                </motion.span>
              </div>
            </div>
          </div>

          {/* Right: Code Stream Hex Tokens & Frequency Equalizer Waves */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
            {/* Hex Tokens Stream */}
            <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
              <span className="text-slate-500 font-bold">HEX:</span>
              {hexTokens.map((token, idx) => (
                <motion.span
                  key={idx}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                  style={{ color: idx === 0 ? themeColors.accent : undefined }}
                >
                  {token}
                </motion.span>
              ))}
            </div>

            {/* Pulsing Audio/Neural Spectrum Bars */}
            <div className="flex items-end gap-1 h-5 px-1">
              {[40, 85, 60, 100, 70, 90, 50].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [`${Math.max(20, h * 0.3)}%`, `${h}%`, `${Math.max(20, h * 0.4)}%`] }}
                  transition={{ duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                  className="w-1 rounded-full"
                  style={{
                    backgroundColor: themeColors.accent,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
