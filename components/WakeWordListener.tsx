import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface WakeWordListenerProps {
  onWakeWordTriggered: () => void;
  isLiveActive: boolean;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export const WakeWordListener: React.FC<WakeWordListenerProps> = ({
  onWakeWordTriggered,
  isLiveActive,
  isEnabled,
  onToggleEnabled
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    if (!isEnabled || isLiveActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart automatically if still enabled & not live
        if (isEnabled && !isLiveActive && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.warn('Speech recognition permission denied for wake word listener');
        }
      };

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          
          // Trigger phrases
          if (
            transcript.includes('hey god') || 
            transcript.includes('ok god') || 
            transcript.includes('hey gemini') || 
            transcript.includes('activate live') ||
            transcript.includes('god listen')
          ) {
            triggerHaptic([40, 80, 40]);
            setDetectedToast(`Wake word detected: "${transcript}"`);
            
            // Stop speech recognition before opening live session to prevent mic conflict
            try {
              recognition.stop();
            } catch (e) {}

            onWakeWordTriggered();

            setTimeout(() => {
              setDetectedToast(null);
            }, 3500);
            break;
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting wake word listener:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, isLiveActive, onWakeWordTriggered]);

  return (
    <>
      {/* Wake Word Toast Trigger Notification */}
      <AnimatePresence>
        {detectedToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#0f172a]/95 border border-[#FAAD3F] text-white shadow-[0_0_30px_rgba(250,173,63,0.4)] backdrop-blur-xl flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-[#F38020]/20 text-[#FAAD3F]">
              <Sparkles size={18} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAAD3F]">
                Hands-Free Wake Word Triggered
              </p>
              <p className="text-xs text-slate-200 font-medium">
                Launching Neural Live Link...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header Control Button for Wake-Word */}
      <div className="fixed top-4 right-20 z-40 hidden sm:flex items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic(15);
            onToggleEnabled(!isEnabled);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border shadow-lg ${
            isEnabled && isListening
              ? 'bg-[#4285F4]/15 border-[#4285F4]/40 text-[#4285F4] shadow-[0_0_12px_rgba(66,133,244,0.2)]'
              : isEnabled
                ? 'bg-[#FAAD3F]/10 border-[#FAAD3F]/30 text-[#FAAD3F]'
                : 'bg-slate-800/60 border-white/10 text-slate-400'
          }`}
          title={isSupported ? "Hands-free Wake Word ('Hey God')" : "Speech Recognition not supported in this browser"}
        >
          {isEnabled ? (
            <Mic size={12} className={isListening ? "animate-pulse text-[#4285F4]" : "text-[#FAAD3F]"} />
          ) : (
            <MicOff size={12} className="text-slate-500" />
          )}
          <span>Wake Word: {isEnabled ? '"Hey God"' : 'Off'}</span>
        </motion.button>
      </div>
    </>
  );
};
