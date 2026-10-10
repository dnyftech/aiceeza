import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mic, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  analyser?: AnalyserNode | null;
  isActive: boolean;
  isBotSpeaking?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyser, 
  isActive, 
  isBotSpeaking = false 
}) => {
  const [frequencies, setFrequencies] = useState<number[]>(Array(24).fill(15));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setFrequencies(Array(24).fill(10));
      return;
    }

    const BAR_COUNT = 24;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 32);

    const updateFrequencies = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / BAR_COUNT);
        const newFreqs: number[] = [];

        for (let i = 0; i < BAR_COUNT; i++) {
          const index = i * step;
          const val = dataArray[index] || 0;
          // Scale 0-255 to percentage 12% - 100%
          const pct = Math.max(12, Math.min(100, Math.round((val / 255) * 100 * 1.3)));
          newFreqs.push(pct);
        }
        setFrequencies(newFreqs);
      } else {
        // Fallback smooth simulated wave for live state when mic analyser is initializing or bot speaking
        const time = Date.now() * 0.005;
        const newFreqs = Array.from({ length: BAR_COUNT }, (_, i) => {
          const amplitude = isBotSpeaking ? 55 : 30;
          const base = isBotSpeaking ? 25 : 15;
          const sine = Math.sin(time + i * 0.4) * amplitude;
          const cos = Math.cos(time * 0.8 + i * 0.2) * (amplitude * 0.5);
          return Math.max(12, Math.min(100, Math.round(base + Math.abs(sine + cos))));
        });
        setFrequencies(newFreqs);
      }

      animationFrameRef.current = requestAnimationFrame(updateFrequencies);
    };

    updateFrequencies();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive, isBotSpeaking]);

  const maxVal = Math.max(...frequencies);

  return (
    <div className="flex flex-col items-center gap-3 mt-6 w-full max-w-md mx-auto">
      {/* Audio Spectrum Bar Container */}
      <div className="relative flex items-end justify-center gap-1.5 h-20 w-full px-6 py-3 rounded-2xl bg-[#0f1726]/80 border border-[#F38020]/25 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Subtle Background Glow behind active bars */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-300 pointer-events-none"
          style={{
            background: isBotSpeaking 
              ? 'radial-gradient(circle at center, #34A853 0%, transparent 70%)' 
              : 'radial-gradient(circle at center, #F38020 0%, transparent 70%)'
          }}
        />

        {frequencies.map((freq, idx) => {
          // Color gradient logic across the spectrum (Low = Orange, Mid = Gold, High = Blue/Green)
          const isMid = idx >= 8 && idx <= 16;
          const isHigh = idx > 16;
          
          let barGradient = 'from-[#F38020] to-[#FAAD3F]';
          if (isBotSpeaking) {
            barGradient = 'from-[#34A853] via-[#FBBC05] to-[#4285F4]';
          } else if (isHigh) {
            barGradient = 'from-[#4285F4] to-[#34A853]';
          } else if (isMid) {
            barGradient = 'from-[#FAAD3F] to-[#F38020]';
          }

          return (
            <div key={idx} className="relative flex-1 flex items-end justify-center h-full">
              <motion.div
                animate={{ height: `${freq}%` }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`w-full max-w-[10px] rounded-full bg-gradient-to-t ${barGradient} shadow-[0_0_10px_rgba(243,128,32,0.4)]`}
              />
            </div>
          );
        })}
      </div>

      {/* Real-time Spectrum Telemetry Tag */}
      <div className="flex items-center justify-between w-full px-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          {isBotSpeaking ? (
            <Volume2 size={12} className="text-[#34A853] animate-pulse" />
          ) : (
            <Mic size={12} className="text-[#F38020] animate-pulse" />
          )}
          <span className={isBotSpeaking ? 'text-[#34A853] font-bold' : 'text-[#FAAD3F] font-bold'}>
            {isBotSpeaking ? 'AI Vocal Response' : 'User Input Spectrum'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Activity size={12} className="text-slate-500" />
          <span>Peak: {maxVal}% • 44.1 kHz</span>
        </div>
      </div>
    </div>
  );
};
