import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface OfflineToastProps {
  isOnline: boolean;
}

export const OfflineToast: React.FC<OfflineToastProps> = ({ isOnline }) => {
  const [showToast, setShowToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowToast(true);
      setWasOffline(true);
      setIsDismissed(false);
      triggerHaptic([30, 50, 30]);
    } else if (wasOffline) {
      // Temporarily show "Back Online" toast for 4 seconds
      setShowToast(true);
      triggerHaptic(20);
      const timer = setTimeout(() => {
        setShowToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showToast || (isDismissed && !isOnline)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-auto"
      >
        <div className={`flex items-center justify-between p-3.5 px-4 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
          !isOnline 
            ? 'bg-[#180f07]/90 border-[#F38020]/50 text-amber-200 shadow-[0_10px_30px_rgba(243,128,32,0.25)]' 
            : 'bg-[#0a1a14]/90 border-emerald-500/50 text-emerald-200 shadow-[0_10px_30px_rgba(52,211,153,0.2)]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              !isOnline ? 'bg-[#F38020]/20 text-[#FAAD3F]' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {!isOnline ? (
                <WifiOff size={18} className="animate-pulse" />
              ) : (
                <Wifi size={18} />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {!isOnline ? 'Offline Mode Active' : 'Network Connection Restored'}
                </span>
                {!isOnline && (
                  <span className="text-[9px] font-mono font-bold bg-[#F38020]/20 text-[#FAAD3F] px-1.5 py-0.5 rounded border border-[#F38020]/40">
                    Local Cache
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                {!isOnline 
                  ? 'Connection lost. Previous messages saved locally.' 
                  : 'Reconnected to Google Neural Cortex network.'}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic(10);
              setIsDismissed(true);
              setShowToast(false);
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-2"
          >
            <X size={14} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
