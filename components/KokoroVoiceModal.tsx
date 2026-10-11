import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Sparkles, 
  Play, 
  Square, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  X, 
  Sliders, 
  Zap, 
  Globe, 
  HardDrive, 
  Check, 
  Radio, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  kokoroService, 
  KOKORO_VOICES, 
  KokoroVoiceProfile, 
  KokoroServiceStatus 
} from '../services/kokoroService';
import { 
  voiceEngine, 
  PreferredEngineSetting, 
  VoiceEngineStatus 
} from '../services/voiceEngine';
import { triggerHaptic } from '../utils/haptics';

interface KokoroVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KokoroVoiceModal: React.FC<KokoroVoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [kokoroStatus, setKokoroStatus] = useState<KokoroServiceStatus>(kokoroService.getStatus());
  const [engineStatus, setEngineStatus] = useState<VoiceEngineStatus>(voiceEngine.getStatus());
  const [genderFilter, setGenderFilter] = useState<'all' | 'Female' | 'Male'>('all');
  const [accentFilter, setAccentFilter] = useState<'all' | 'American' | 'British'>('all');
  const [testText, setTestText] = useState('God AI neural voice engine is online. Kokoro 82M delivers crystal clear speech directly in your browser.');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubKokoro = kokoroService.subscribe(setKokoroStatus);
    const unsubEngine = voiceEngine.subscribe(setEngineStatus);
    return () => {
      unsubKokoro();
      unsubEngine();
    };
  }, []);

  // Real-time audio level visualizer during speech
  useEffect(() => {
    if (engineStatus.isSpeaking) {
      const analyser = voiceEngine.getAnalyser();
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } else {
      setAudioLevel(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [engineStatus.isSpeaking]);

  if (!isOpen) return null;

  const filteredVoices = KOKORO_VOICES.filter((v) => {
    if (genderFilter !== 'all' && v.gender !== genderFilter) return false;
    if (accentFilter !== 'all' && v.accent !== accentFilter) return false;
    return true;
  });

  const handlePreload = async () => {
    triggerHaptic(20);
    try {
      await kokoroService.loadModel();
    } catch (e) {
      console.error('Preload failed:', e);
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    triggerHaptic(15);
    kokoroService.setVoice(voiceId);
  };

  const handleSelectEngine = (engine: PreferredEngineSetting) => {
    triggerHaptic(20);
    voiceEngine.setPreferredEngine(engine);
  };

  const handlePlayVoiceSample = async (voice: KokoroVoiceProfile) => {
    triggerHaptic(15);
    kokoroService.setVoice(voice.id);
    setIsPlayingTest(true);

    try {
      await voiceEngine.speak(voice.sampleText, {
        engineOverride: 'kokoro',
        onEnd: () => setIsPlayingTest(false),
        onError: () => setIsPlayingTest(false),
      });
    } catch (e) {
      setIsPlayingTest(false);
    }
  };

  const handleTestCustomSpeech = async () => {
    if (!testText.trim()) return;
    triggerHaptic(20);
    setIsPlayingTest(true);

    try {
      await voiceEngine.speak(testText, {
        engineOverride: engineStatus.preferredEngine === 'auto' ? undefined : engineStatus.preferredEngine,
        onEnd: () => setIsPlayingTest(false),
        onError: () => setIsPlayingTest(false),
      });
    } catch (e) {
      setIsPlayingTest(false);
    }
  };

  const handleStopSpeech = () => {
    triggerHaptic(15);
    voiceEngine.stop();
    setIsPlayingTest(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f17] border border-[#FAAD3F]/30 rounded-3xl shadow-2xl shadow-orange-950/40 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#121927] to-[#0d131f] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F38020]/20 border border-[#FAAD3F]/40 flex items-center justify-center text-[#FAAD3F] shadow-lg shadow-[#F38020]/15">
              <Cpu size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Kokoro-82M Voice Engine</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider">
                  Open Weights
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider">
                  {kokoroStatus.device.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                82-Million parameter on-device neural text-to-speech synthesizer running 100% locally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {engineStatus.isSpeaking && (
              <button
                onClick={handleStopSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold hover:bg-red-500/30 transition-all"
              >
                <Square size={13} className="fill-current" />
                Stop Audio
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Engine Status & Model Weights Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121927] to-[#151e30] border border-[#FAAD3F]/25 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FAAD3F]">
                    Neural Engine Status:
                  </span>
                  {kokoroStatus.state === 'ready' ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Model Loaded & Ready in Memory
                    </span>
                  ) : kokoroStatus.state === 'loading' ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-[#FAAD3F] font-bold animate-pulse">
                      <RefreshCw size={14} className="animate-spin text-[#FAAD3F]" />
                      Downloading Kokoro Weights ({kokoroStatus.progress?.progress ?? 0}%)
                    </span>
                  ) : kokoroStatus.state === 'synthesizing' ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-purple-400 font-bold animate-pulse">
                      <Zap size={14} />
                      Synthesizing Neural Audio...
                    </span>
                  ) : kokoroStatus.state === 'error' ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold">
                      <AlertCircle size={14} />
                      Initialization Notice
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400 font-bold">
                      <HardDrive size={14} />
                      {kokoroStatus.isModelCached ? 'Cached locally (Instant startup)' : 'Ready to Load (82M quantized)'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Runs directly on client hardware via Transformers.js ONNX runtime without sending any text to external servers. High-fidelity 24,000 Hz synthesis.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 shrink-0">
                {kokoroStatus.state !== 'ready' && (
                  <button
                    onClick={handlePreload}
                    disabled={kokoroStatus.state === 'loading'}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                      kokoroStatus.state === 'loading'
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black hover:opacity-90 shadow-orange-500/20'
                    }`}
                  >
                    {kokoroStatus.state === 'loading' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Preload 82M Model
                      </>
                    )}
                  </button>
                )}

                {kokoroStatus.state === 'ready' && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                    <ShieldCheck size={16} />
                    Active (24kHz)
                  </div>
                )}
              </div>
            </div>

            {/* Download Progress Bar */}
            {kokoroStatus.state === 'loading' && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="truncate max-w-md">{kokoroStatus.progress?.status || 'Downloading model...'}</span>
                  <span className="text-[#FAAD3F] font-bold">{kokoroStatus.progress?.progress ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#F38020] to-[#FAAD3F]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${kokoroStatus.progress?.progress ?? 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Engine Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FAAD3F] flex items-center gap-2">
                <Radio size={14} />
                Global Voice Engine Selector
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Active: <span className="text-white font-bold">{engineStatus.preferredEngine.toUpperCase()}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  id: 'kokoro',
                  name: 'Kokoro-82M',
                  tag: 'On-Device Neural',
                  desc: '100% client-side privacy, open weights, natural human cadence',
                  color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
                  activeBorder: 'border-cyan-400 ring-2 ring-cyan-500/30 bg-cyan-950/40',
                },
                {
                  id: 'gemini',
                  name: 'Gemini 3.8 Flash',
                  tag: 'Cloud High-Fi',
                  desc: 'High-fidelity multimodal voice with emotional styles',
                  color: 'border-[#FAAD3F]/40 bg-[#FAAD3F]/10 text-[#FAAD3F]',
                  activeBorder: 'border-[#FAAD3F] ring-2 ring-[#FAAD3F]/30 bg-[#FAAD3F]/20',
                },
                {
                  id: 'browser',
                  name: 'Web Speech API',
                  tag: 'Native Browser',
                  desc: 'Zero download, built-in system voices for instant output',
                  color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
                  activeBorder: 'border-purple-400 ring-2 ring-purple-500/30 bg-purple-950/40',
                },
                {
                  id: 'auto',
                  name: 'Smart Auto',
                  tag: 'Recommended',
                  desc: 'Kokoro if loaded, falling back to Gemini and Web Speech',
                  color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                  activeBorder: 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/40',
                },
              ].map((opt) => {
                const isSelected = engineStatus.preferredEngine === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectEngine(opt.id as PreferredEngineSetting)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected ? opt.activeBorder : 'border-white/10 bg-[#121927]/60 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">{opt.name}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border mb-2 ${opt.color}`}>
                        {opt.tag}
                      </span>
                      <p className="text-xs text-slate-400 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kokoro Voice Library */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FAAD3F] flex items-center gap-2">
                  <Sparkles size={14} />
                  Kokoro Voices Catalog ({filteredVoices.length} available)
                </h3>
                <p className="text-xs text-slate-400">
                  Select your default neural persona or preview their natural intonation
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                {/* Gender */}
                <div className="flex bg-[#121927] p-1 rounded-xl border border-white/10">
                  {(['all', 'Female', 'Male'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenderFilter(g)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        genderFilter === g
                          ? 'bg-[#FAAD3F] text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {g === 'all' ? 'All Genders' : g}
                    </button>
                  ))}
                </div>

                {/* Accent */}
                <div className="flex bg-[#121927] p-1 rounded-xl border border-white/10">
                  {(['all', 'American', 'British'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAccentFilter(a)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        accentFilter === a
                          ? 'bg-[#FAAD3F] text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {a === 'all' ? 'All Accents' : a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredVoices.map((voice) => {
                const isSelected = kokoroStatus.activeVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FAAD3F] bg-gradient-to-br from-[#1b263b] to-[#121927] ring-1 ring-[#FAAD3F]/40 shadow-lg shadow-orange-950/20'
                        : 'border-white/10 bg-[#101622] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{voice.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                              {voice.grade}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {voice.traits} • {voice.accent}
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#FAAD3F] text-black flex items-center justify-center shrink-0">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-snug mb-3 line-clamp-2">
                        {voice.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        {voice.targetQuality}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVoiceSample(voice);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAAD3F]/15 hover:bg-[#FAAD3F]/30 border border-[#FAAD3F]/30 text-[#FAAD3F] text-xs font-mono font-bold transition-all"
                        title="Listen to voice sample"
                      >
                        <Play size={11} className="fill-current" />
                        Listen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Playground & Tuning */}
          <div className="p-4 rounded-2xl bg-[#121927] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FAAD3F] flex items-center gap-2">
                <Sliders size={14} />
                Live Speech Synthesis Playground
              </h3>

              {/* Audio meter */}
              {engineStatus.isSpeaking && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(20, audioLevel)}%` }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-bounce delay-75" style={{ height: `${Math.max(30, audioLevel * 0.8)}%` }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-bounce delay-150" style={{ height: `${Math.max(15, audioLevel * 1.2)}%` }} />
                  </div>
                  Speaking ({engineStatus.currentEngine})
                </div>
              )}
            </div>

            {/* Controls: Speed & Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Speaking Speed</span>
                  <span className="text-[#FAAD3F] font-bold">{kokoroStatus.speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.75"
                  step="0.05"
                  value={kokoroStatus.speed}
                  onChange={(e) => kokoroService.setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#FAAD3F]"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.75x (Fast)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Master Volume</span>
                  <span className="text-[#FAAD3F] font-bold">{Math.round(engineStatus.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={engineStatus.volume}
                  onChange={(e) => voiceEngine.setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#FAAD3F]"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0% (Mute)</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Custom Text Prompt */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono text-slate-400 block">
                Test Sentence (Phonemized by Kokoro & Synthesized to Web Audio):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to synthesize out loud..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FAAD3F]/60 font-sans"
                />
                <button
                  onClick={isPlayingTest ? handleStopSpeech : handleTestCustomSpeech}
                  disabled={!testText.trim()}
                  className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isPlayingTest
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black hover:opacity-90 shadow-lg shadow-orange-500/20'
                  }`}
                >
                  {isPlayingTest ? (
                    <>
                      <Square size={14} className="fill-current" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      Speak Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0d131f] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Globe size={14} className="text-[#FAAD3F]" />
            <span>Voice: <strong className="text-white">{kokoroStatus.activeVoice}</strong></span>
            <span>•</span>
            <span>Engine: <strong className="text-white">{engineStatus.preferredEngine}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
