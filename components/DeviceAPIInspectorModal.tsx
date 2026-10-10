import React from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  Battery, 
  BatteryCharging, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  X, 
  Download, 
  Radio, 
  Maximize, 
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import { DeviceCapabilities } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface DeviceAPIInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  capabilities: DeviceCapabilities;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const DeviceAPIInspectorModal: React.FC<DeviceAPIInspectorModalProps> = ({
  isOpen,
  onClose,
  capabilities,
  onInstallPWA,
  canInstallPWA,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#090f1d] border border-[#FAAD3F]/40 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#121c33] via-[#0f172a] to-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAAD3F]/15 border border-[#FAAD3F]/30 flex items-center justify-center text-[#FAAD3F] shadow-lg">
              {capabilities.deviceType === 'mobile' && <Smartphone size={20} />}
              {capabilities.deviceType === 'tablet' && <Tablet size={20} />}
              {capabilities.deviceType === 'desktop' && <Monitor size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display italic text-white">
                  Cross-Device API Module
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                  {capabilities.deviceType}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live inspection of device hardware, Web APIs, screen geometry & cross-device responsiveness.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(10);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Device Stats Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#060a14]">
          
          {/* Top Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0d1424] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Viewport</span>
              <span className="text-base font-bold text-white font-mono">
                {capabilities.viewportWidth} × {capabilities.viewportHeight}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                DPR: {capabilities.devicePixelRatio}x
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0d1424] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Network</span>
              <span className="text-base font-bold text-white font-mono uppercase">
                {capabilities.connectionType}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                {capabilities.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0d1424] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Battery</span>
              <div className="flex items-center gap-1.5 text-base font-bold text-[#FAAD3F] font-mono">
                {capabilities.batteryCharging ? <BatteryCharging size={16} /> : <Battery size={16} />}
                <span>{capabilities.batteryLevel !== undefined ? `${capabilities.batteryLevel}%` : 'AC Power'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                {capabilities.batteryCharging ? 'Charging' : 'Normal'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0d1424] border border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">PWA Mode</span>
              <span className="text-base font-bold text-white font-mono">
                {capabilities.pwaStandalone ? 'Standalone' : 'Browser'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                {capabilities.platform}
              </span>
            </div>
          </div>

          {/* Web API Capabilities Matrix */}
          <div className="p-4 rounded-2xl bg-[#0d1424] border border-white/10 space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#FAAD3F] font-bold">
              Detected Hardware & Web API Modules
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">Touch Interface</span>
                <span className={capabilities.isTouch ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {capabilities.isTouch ? `Yes (${capabilities.touchPoints} pts)` : 'Mouse / Trackpad'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">WebAudio DSP Pipeline</span>
                <span className={capabilities.webAudioSupported ? "text-emerald-400 font-bold" : "text-red-400"}>
                  {capabilities.webAudioSupported ? 'Supported (24kHz)' : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">Speech Synthesis Engine</span>
                <span className={capabilities.webSpeechSupported ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {capabilities.webSpeechSupported ? 'Native WebSpeech' : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">CPU Thread Concurrency</span>
                <span className="text-[#38bdf8] font-bold">
                  {capabilities.hardwareConcurrency} Cores
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">Device RAM Allocation</span>
                <span className="text-[#38bdf8] font-bold">
                  ~{capabilities.deviceMemoryGb} GB
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-300">Downlink Throughput</span>
                <span className="text-emerald-400 font-bold">
                  ~{capabilities.downlinkSpeed} Mbps
                </span>
              </div>
            </div>
          </div>

          {/* Cross-Device PWA Installation Action */}
          {canInstallPWA && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F38020]/15 via-[#FAAD3F]/10 to-transparent border border-[#FAAD3F]/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Install on this Device</h4>
                <p className="text-xs text-slate-300">Launch GOD AI directly from your app drawer or home screen without browser bars.</p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  if (onInstallPWA) onInstallPWA();
                }}
                className="px-4 py-2 rounded-xl bg-[#FAAD3F] hover:brightness-110 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg flex-shrink-0"
              >
                <Download size={14} />
                <span>Install</span>
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
