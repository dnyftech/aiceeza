import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Mic, 
  MicOff, 
  Camera, 
  Timer, 
  Clock, 
  Zap, 
  Flame, 
  Volume2, 
  VolumeX, 
  X, 
  Maximize2, 
  Minimize2, 
  Send, 
  Sparkles, 
  Share2, 
  Clipboard, 
  Compass, 
  Battery, 
  BatteryCharging, 
  Eye, 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  Phone, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { 
  androidAssistantService, 
  AndroidTimer 
} from '../services/androidAssistantService';
import { voiceEngine, VoiceEngineStatus } from '../services/voiceEngine';
import { kokoroService } from '../services/kokoroService';
import { sendMessageToGemini } from '../services/geminiService';
import { detectAndExecuteAndroidIntent } from '../utils/androidIntents';
import { triggerHaptic } from '../utils/haptics';
import { ModelMode } from '../types';

interface AndroidAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveVoice?: () => void;
  onMinimizeToBubble?: () => void;
}

export const AndroidAssistantOverlay: React.FC<AndroidAssistantOverlayProps> = ({
  isOpen,
  onClose,
  onOpenLiveVoice,
  onMinimizeToBubble,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'vision' | 'timers' | 'tools'>('voice');
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Hardware states
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isWakeLockOn, setIsWakeLockOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isBatteryCharging, setIsBatteryCharging] = useState(false);
  const [timers, setTimers] = useState<AndroidTimer[]>([]);

  // Camera Vision Lens states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);

  // Speech Recognition ref
  const speechRecognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync service states
  useEffect(() => {
    const unsub = androidAssistantService.subscribe(() => {
      setIsTorchOn(androidAssistantService.getTorchStatus());
      setIsWakeLockOn(androidAssistantService.isScreenWakeLocked());
      setTimers(androidAssistantService.getTimers());
    });

    setIsTorchOn(androidAssistantService.getTorchStatus());
    setIsWakeLockOn(androidAssistantService.isScreenWakeLocked());
    setTimers(androidAssistantService.getTimers());

    // Battery API check
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsBatteryCharging(battery.charging);
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsBatteryCharging(battery.charging));
      }).catch(() => {});
    }

    return () => {
      unsub();
      stopCamera();
      stopSpeechRecognition();
    };
  }, []);

  // When overlay opens, automatically start speech recognition and request wakelock
  useEffect(() => {
    if (isOpen) {
      triggerHaptic([20, 30, 20]);
      androidAssistantService.requestWakeLock();
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
      stopCamera();
    }
  }, [isOpen]);

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in browser');
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        triggerHaptic(15);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);

        // If finalized, submit to assistant
        if (event.results[event.results.length - 1].isFinal) {
          triggerHaptic(25);
          handleProcessAssistantQuery(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
  };

  // --- CAMERA LENS PERCEPTION ---
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCapturedImageBase64(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      triggerHaptic(20);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Unable to access camera. Please check camera permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    triggerHaptic(30);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];
    setCapturedImageBase64(dataUrl);

    stopCamera();

    // Query Assistant with vision perception
    setIsProcessing(true);
    setAssistantReply('Analyzing visual scene with Gemini Multimodal Vision...');
    try {
      const response = await sendMessageToGemini({
        message: inputQuery.trim() || 'Describe and inspect this scene. Identify key objects, text, or instructions.',
        mode: ModelMode.Pro,
        attachments: [{
          type: 'image',
          data: base64Data,
          mimeType: 'image/jpeg',
        }],
      });

      const replyText = response.text || 'Visual scene processed.';
      setAssistantReply(replyText);
      voiceEngine.speak(replyText);
    } catch (e: any) {
      setAssistantReply(`Visual analysis failed: ${e?.message || 'Error connecting to Gemini'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- QUERY PROCESSING ---
  const handleProcessAssistantQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    stopSpeechRecognition();
    setIsProcessing(true);
    triggerHaptic(20);

    // 1. Check if matching Android Intent
    const intentResult = detectAndExecuteAndroidIntent(text);
    if (intentResult) {
      setAssistantReply(intentResult.confirmationText);
      voiceEngine.speak(intentResult.confirmationText);

      if (intentResult.actionUrl && (text.includes('navigate') || text.includes('call') || text.includes('whatsapp'))) {
        setTimeout(() => {
          androidAssistantService.dispatchIntent(intentResult.actionUrl!);
        }, 1200);
      }

      setIsProcessing(false);
      return;
    }

    // 2. Query Gemini Assistant with Mobile Assistant System Persona
    try {
      const response = await sendMessageToGemini({
        message: text,
        mode: ModelMode.Pro,
        personalityId: 'ceeza',
        enableSearchGrounding: true,
      });

      const reply = response.text || 'Assistant command executed.';
      setAssistantReply(reply);

      // Speak reply out loud with current Voice Engine (Kokoro-82M / Gemini Neural)
      voiceEngine.speak(reply);
    } catch (err: any) {
      const errorMsg = `Assistant connection error: ${err?.message || 'Unable to complete request'}`;
      setAssistantReply(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- QUICK ACTION HANDLERS ---
  const handleToggleTorch = async () => {
    triggerHaptic(25);
    await androidAssistantService.toggleTorch();
  };

  const handleToggleWakeLock = async () => {
    triggerHaptic(20);
    if (isWakeLockOn) {
      androidAssistantService.releaseWakeLock();
    } else {
      await androidAssistantService.requestWakeLock();
    }
  };

  const handlePasteClipboard = async () => {
    const clipText = await androidAssistantService.readClipboard();
    if (clipText) {
      setInputQuery(clipText);
      handleProcessAssistantQuery(`Summarize and extract key actions from this clipboard content: "${clipText}"`);
    }
  };

  const handleShareResponse = () => {
    if (assistantReply) {
      androidAssistantService.shareContent('GOD AI Digital Assistant Response', assistantReply);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      {/* Assistant Bottom Drawer Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={`pointer-events-auto w-full max-w-2xl mx-auto bg-gradient-to-b from-[#101726]/95 via-[#0c121e]/98 to-black/98 border-t border-[#34A853]/40 rounded-t-[2.5rem] shadow-[0_-10px_50px_rgba(52,168,83,0.25)] flex flex-col overflow-hidden transition-all duration-300 relative ${
          isFullScreen ? 'h-[92vh]' : 'max-h-[85vh]'
        }`}
      >
        {/* Android Assistant Drag Handle & Header */}
        <div className="pt-3 pb-2 px-6 flex flex-col items-center flex-shrink-0 border-b border-white/10 relative">
          <div className="w-12 h-1.5 rounded-full bg-white/20 mb-3" />

          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] via-[#34A853] to-[#FAAD3F] flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <Sparkles size={16} className="text-[#34A853] animate-pulse" />
                  </div>
                </div>
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5 font-display italic">
                    GOD AI <span className="text-[11px] not-italic font-mono text-[#34A853] font-bold px-2 py-0.2 rounded-md bg-[#34A853]/15 border border-[#34A853]/30">ASSISTANT</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    Android Digital Core
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5">
              {batteryLevel !== null && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  {isBatteryCharging ? (
                    <BatteryCharging size={13} className="text-emerald-400" />
                  ) : (
                    <Battery size={13} className="text-slate-400" />
                  )}
                  <span>{batteryLevel}%</span>
                </div>
              )}

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isFullScreen ? "Collapse view" : "Expand fullscreen"}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {onMinimizeToBubble && (
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    onMinimizeToBubble();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-mono font-bold transition-colors"
                  title="Minimize to floating assistant bubble"
                >
                  Bubble
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Assistant Modes Navigation */}
          <div className="w-full flex items-center justify-around mt-3 pt-2 border-t border-white/5 text-xs font-mono">
            {[
              { id: 'voice', label: 'Vocal Assistant', icon: Mic },
              { id: 'vision', label: 'Vision Lens', icon: Camera },
              { id: 'timers', label: `Timers (${timers.length})`, icon: Timer },
              { id: 'tools', label: 'Phone Tools', icon: Smartphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic(15);
                    setActiveTab(tab.id as any);
                    if (tab.id === 'vision' && !isCameraActive) {
                      startCamera();
                    } else if (tab.id !== 'vision' && isCameraActive) {
                      stopCamera();
                    }
                  }}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#34A853]/20 border border-[#34A853]/50 text-[#34A853] font-bold shadow-md shadow-emerald-950/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assistant Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* TAB 1: VOICE ASSISTANT */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              {/* Vocal Waveform & Orb Animation */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden">
                <div className="relative mb-3">
                  <motion.div
                    animate={isListening ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4285F4] via-[#34A853] to-[#FAAD3F] blur-lg opacity-40 absolute inset-0"
                  />
                  <div className="w-20 h-20 rounded-full bg-black border-2 border-[#34A853] flex items-center justify-center relative z-10 shadow-xl shadow-emerald-500/20">
                    {isProcessing ? (
                      <Sparkles size={32} className="text-[#34A853] animate-spin" />
                    ) : isListening ? (
                      <Mic size={32} className="text-emerald-400 animate-pulse" />
                    ) : (
                      <Smartphone size={32} className="text-slate-300" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="font-bold text-sm text-white">
                    {isListening ? 'Listening on Android Microphone...' : isProcessing ? 'Processing Neural Intent...' : 'Ready for Assistant Command'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isListening ? 'Speak naturally: "Turn on torch", "Navigate to cafe", "Set timer for 5 min"' : 'Tap microphone or type below to command your digital assistant'}
                  </p>
                </div>

                {/* Animated Speech Bars */}
                {isListening && (
                  <div className="flex items-center gap-1 mt-3 h-6">
                    {[12, 24, 18, 30, 16, 26, 20, 14].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, h, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5 + (i * 0.08) }}
                        className="w-1 bg-gradient-to-t from-[#4285F4] to-[#34A853] rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Live Assistant Response Display */}
              {assistantReply && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#131d2e] to-[#0c1422] border border-[#34A853]/30 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#34A853] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Assistant Intelligence Response
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShareResponse}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title="Share response"
                      >
                        <Share2 size={13} />
                      </button>
                      <button
                        onClick={() => voiceEngine.speak(assistantReply)}
                        className="p-1 rounded text-slate-400 hover:text-[#34A853] transition-colors"
                        title="Speak again"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {assistantReply}
                  </p>
                </motion.div>
              )}

              {/* Quick Assistant Suggestion Chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Quick Android Assistant Commands:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
                  {[
                    "🔦 Turn on flashlight",
                    "⏱️ Set timer for 5 minutes",
                    "📍 Navigate to nearest coffee",
                    "🔋 Check battery level",
                    "📝 Take a note",
                    "📞 Call 555-0199"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        triggerHaptic(15);
                        setInputQuery(chip);
                        handleProcessAssistantQuery(chip);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white shrink-0 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISION LENS */}
          {activeTab === 'vision' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black aspect-video flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/40 rounded-2xl m-4 border-dashed" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
                      <Eye size={12} className="animate-pulse" />
                      Live Android Viewfinder
                    </div>
                  </>
                ) : capturedImageBase64 ? (
                  <img
                    src={capturedImageBase64}
                    alt="Captured Lens Frame"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <Camera size={40} className="mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400">
                      {cameraError || 'Lens camera inactive. Tap below to launch rear camera.'}
                    </p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Actions */}
              <div className="flex items-center gap-2">
                {isCameraActive ? (
                  <button
                    onClick={captureCameraFrame}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Camera size={16} />
                    Inspect Scene with Gemini Lens
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    Launch Assistant Camera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TIMERS & ALARMS */}
          {activeTab === 'timers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Timer size={14} className="text-[#FAAD3F]" />
                  Active Countdown Alarms
                </h4>
                <div className="flex gap-1.5 text-xs font-mono">
                  {[1, 5, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => androidAssistantService.createTimer(`${mins}m Timer`, mins * 60)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>

              {timers.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400 font-mono">
                  No active timers. Speak "Set timer for 5 minutes" or tap quick presets above.
                </div>
              ) : (
                <div className="space-y-2">
                  {timers.map((timer) => {
                    const mins = Math.floor(timer.remainingSeconds / 60);
                    const secs = timer.remainingSeconds % 60;
                    const isDone = timer.remainingSeconds === 0;

                    return (
                      <div
                        key={timer.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isDone
                            ? 'bg-red-500/20 border-red-500/40 text-red-200 animate-pulse'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-white">{timer.label}</div>
                          <div className="text-xl font-mono font-bold text-[#FAAD3F]">
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => androidAssistantService.toggleTimer(timer.id)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                          >
                            {timer.isRunning ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={() => androidAssistantService.resetTimer(timer.id)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => androidAssistantService.deleteTimer(timer.id)}
                            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHONE TOOLS & QUICK SETTINGS */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">
                Android Hardware & System Bridge Tiles
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Physical Flashlight Torch */}
                <button
                  onClick={handleToggleTorch}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between text-left transition-all ${
                    isTorchOn
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Flame size={20} className={isTorchOn ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {isTorchOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Physical Torch</div>
                    <div className="text-[10px] text-slate-400">Hardware flashlight</div>
                  </div>
                </button>

                {/* Screen Wake Lock */}
                <button
                  onClick={handleToggleWakeLock}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between text-left transition-all ${
                    isWakeLockOn
                      ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap size={20} className={isWakeLockOn ? 'text-blue-400' : 'text-slate-400'} />
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {isWakeLockOn ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Keep Screen On</div>
                    <div className="text-[10px] text-slate-400">Screen WakeLock API</div>
                  </div>
                </button>

                {/* Clipboard Reader */}
                <button
                  onClick={handlePasteClipboard}
                  className="p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 text-slate-300 text-left flex flex-col justify-between"
                >
                  <Clipboard size={20} className="text-[#FAAD3F] mb-2" />
                  <div>
                    <div className="font-bold text-xs text-white">Read Clipboard</div>
                    <div className="text-[10px] text-slate-400">Inspect & summarize copied text</div>
                  </div>
                </button>

                {/* Google Maps Nearby */}
                <button
                  onClick={() => androidAssistantService.openMapsSearch('Nearby')}
                  className="p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 text-slate-300 text-left flex flex-col justify-between"
                >
                  <Compass size={20} className="text-emerald-400 mb-2" />
                  <div>
                    <div className="font-bold text-xs text-white">Maps Navigation</div>
                    <div className="text-[10px] text-slate-400">Directions & places nearby</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/80 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
            className={`p-3 rounded-2xl transition-all shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#34A853] text-black hover:bg-[#34A853]/90 shadow-lg shadow-emerald-500/20'
            }`}
            title={isListening ? "Stop listening" : "Tap to speak"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleProcessAssistantQuery(inputQuery);
              }
            }}
            placeholder={isListening ? 'Listening to speech...' : 'Type or speak to assistant...'}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#34A853]/60 font-sans"
          />

          <button
            onClick={() => handleProcessAssistantQuery(inputQuery)}
            disabled={!inputQuery.trim() || isProcessing}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            title="Send assistant command"
          >
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
