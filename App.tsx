import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, Zap, RotateCcw, Moon, Sun, Play, X, Download, CheckCircle2, ArrowDown, Trash2, Mic, Cpu, Terminal, ShieldCheck, Activity, Layers, Radio, Sparkles, Volume2, VolumeX, Palette, Sliders, ArrowLeftRight, Check, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputBar from './components/InputBar';
import ChatMessage from './components/ChatMessage';
import Orb, { IndicatingOrb } from './components/Orb';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { AndroidLayoutCards } from './components/AndroidLayoutCards';
import { OfflineToast } from './components/OfflineToast';
import { WakeWordListener } from './components/WakeWordListener';
import { ChatPlaceholder } from './components/ChatPlaceholder';
import { LiveVoiceSession } from './components/LiveVoiceSession';
import { Message, Sender, ModelMode, VoicePersonalityId, OrbTheme, UserProfile, AssistantTask } from './types';
import { sendMessageToGemini, generateSpeech, connectLiveSession, transcribeAudio, VOICE_PERSONALITIES, AVAILABLE_VOICES } from './services/geminiService';
import { decodeAudioData } from './services/audio';
import { triggerHaptic } from './utils/haptics';
import { CeezaVoiceInputModal } from './components/CeezaVoiceInputModal';
import { UserAccountModal } from './components/UserAccountModal';
import { AndroidAssistantModal } from './components/AndroidAssistantModal';
import { detectAndExecuteAndroidIntent, DEFAULT_TASKS } from './utils/androidIntents';
import { Smartphone, User } from 'lucide-react';

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Caesar Alpha',
    email: 'caesar.master@godai.io',
    avatar: '⚡',
    role: '99% Intelligence Tier',
    theme: 'classic',
    queriesCount: 42,
    voiceSessionsCount: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    name: 'System Architect',
    email: 'architect@godai.io',
    avatar: '🛠️',
    role: 'System Architect',
    theme: 'emerald',
    queriesCount: 19,
    voiceSessionsCount: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    name: 'Guest User',
    email: 'guest@godai.io',
    avatar: '👤',
    role: 'Guest User',
    theme: 'nebula',
    queriesCount: 5,
    voiceSessionsCount: 2,
    createdAt: new Date().toISOString(),
  },
];

const CHAT_STORAGE_KEY = 'god_ai_chat_history_v1';

const generateFollowUpChips = (msgList: Message[]): string[] => {
  if (!msgList || msgList.length === 0) {
    return [
      "✨ Explain Quantum Computing simply",
      "⚡ What are Gemini 3.6 Flash features?",
      "🎨 Suggest a modern UI color palette"
    ];
  }

  const lastMsg = [...msgList].reverse().find(m => m.text && m.text.trim().length > 0);
  if (!lastMsg) {
    return [
      "✨ Tell me what you can do",
      "⚡ Help me debug React code",
      "💡 Suggest a creative project idea"
    ];
  }

  const text = lastMsg.text.toLowerCase();

  if (text.includes('code') || text.includes('react') || text.includes('function') || text.includes('typescript') || text.includes('bug') || text.includes('error') || text.includes('component')) {
    return [
      "⚡ Write unit tests for this",
      "🛠️ Refactor for better performance",
      "🔍 Explain the logic step-by-step"
    ];
  }

  if (text.includes('design') || text.includes('color') || text.includes('ui') || text.includes('android') || text.includes('pwa') || text.includes('style') || text.includes('css')) {
    return [
      "🎨 Suggest 3 color palette variations",
      "📱 How to make this mobile responsive?",
      "✨ Add subtle entrance animations"
    ];
  }

  if (text.includes('think') || text.includes('reason') || text.includes('cortex') || text.includes('explain') || text.includes('how') || text.includes('why')) {
    return [
      "🧠 What are potential edge cases?",
      "💡 Give me a real-world example",
      "📋 Summarize key takeaways in bullets"
    ];
  }

  if (text.includes('image') || text.includes('photo') || text.includes('visual') || text.includes('picture')) {
    return [
      "🔍 Detail the visual features in depth",
      "🎨 Generate CSS inspired by this image",
      "💡 What design improvements would you make?"
    ];
  }

  return [
    "💡 Tell me more details about this",
    "🔍 What are the pros and cons?",
    "⚡ Give me 3 practical examples"
  ];
};

const loadSavedMessages = (): Message[] => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  } catch (e) {
    console.error('Failed to load chat history from local storage:', e);
    return [];
  }
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(loadSavedMessages);
  const [mode, setMode] = useState<ModelMode>(ModelMode.Pro);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return loadSavedMessages().length > 0;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<{ text: string; sender: 'user' | 'bot' } | null>(null);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);

  const followUpChips = useMemo(() => generateFollowUpChips(messages), [messages]);

  // PWA & Network State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(true);
  
  // User Accounts State
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('god_ai_users_list');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('god_ai_active_user_id') || 'usr-1';
  });

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || users[0] || DEFAULT_USERS[0];
  }, [users, activeUserId]);

  // Android Assistant Tasks State
  const [assistantTasks, setAssistantTasks] = useState<AssistantTask[]>(() => {
    try {
      const saved = localStorage.getItem('god_ai_assistant_tasks');
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  // Modal Visibility Controls
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showCeezaVoiceModal, setShowCeezaVoiceModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('god_ai_users_list', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users list:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('god_ai_active_user_id', activeUserId);
    } catch (e) {
      console.error('Failed to save active user ID:', e);
    }
  }, [activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem('god_ai_assistant_tasks', JSON.stringify(assistantTasks));
    } catch (e) {
      console.error('Failed to save assistant tasks:', e);
    }
  }, [assistantTasks]);

  const handleCreateUser = (name: string, role: UserProfile['role']) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@godai.io`,
      avatar: ['🔥', '⚡', '🤖', '👑', '🚀'][Math.floor(Math.random() * 5)],
      role,
      theme: 'classic',
      queriesCount: 0,
      voiceSessionsCount: 0,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setActiveUserId(newUser.id);
  };

  const handleSwitchUser = (userId: string) => {
    setActiveUserId(userId);
  };

  const incrementUserQueryCount = () => {
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, queriesCount: u.queriesCount + 1 } : u))
    );
  };

  const incrementUserVoiceCount = () => {
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, voiceSessionsCount: u.voiceSessionsCount + 1 } : u))
    );
  };

  const handleAddTask = (taskData: Omit<AssistantTask, 'id' | 'createdAt'>) => {
    const newTask: AssistantTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAssistantTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    setAssistantTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setAssistantTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const [personalityId, setPersonalityId] = useState<VoicePersonalityId>(() => {
    const saved = localStorage.getItem('god_ai_voice_personality');
    return (saved as VoicePersonalityId) || 'ceeza';
  });

  const [orbTheme, setOrbTheme] = useState<OrbTheme>(() => {
    const saved = localStorage.getItem('god_ai_orb_theme');
    return (saved as OrbTheme) || 'classic';
  });

  const [customVoiceName, setCustomVoiceName] = useState<string>(() => {
    return localStorage.getItem('god_ai_custom_voice') || '';
  });

  const [gestureToast, setGestureToast] = useState<{ text: string; type: 'clear' | 'thinking' } | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('god_ai_voice_personality', personalityId);
    } catch (e) {
      console.error('Failed to save voice personality:', e);
    }
  }, [personalityId]);

  useEffect(() => {
    try {
      localStorage.setItem('god_ai_orb_theme', orbTheme);
    } catch (e) {
      console.error('Failed to save orb theme:', e);
    }
  }, [orbTheme]);

  useEffect(() => {
    try {
      if (customVoiceName) {
        localStorage.setItem('god_ai_custom_voice', customVoiceName);
      } else {
        localStorage.removeItem('god_ai_custom_voice');
      }
    } catch (e) {
      console.error('Failed to save custom voice:', e);
    }
  }, [customVoiceName]);

  const showGestureToast = (text: string, type: 'clear' | 'thinking') => {
    setGestureToast({ text, type });
    setTimeout(() => {
      setGestureToast(null);
    }, 2500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Horizontal swipe gesture (>90px X offset, <70px Y offset)
    if (Math.abs(deltaX) > 90 && Math.abs(deltaY) < 70) {
      if (deltaX < 0) {
        // Swipe Left -> Clear current chat
        triggerHaptic(40);
        setMessages([]);
        setHasStarted(false);
        showGestureToast("Swipe Left: Current Chat Cleared", "clear");
      } else {
        // Swipe Right -> Toggle Thinking Mode
        triggerHaptic(30);
        setMode(prev => {
          const nextMode = prev === ModelMode.Thinking ? ModelMode.Pro : ModelMode.Thinking;
          const msg = nextMode === ModelMode.Thinking ? "Swipe Right: Thinking Mode Active" : "Swipe Right: Pro Mode Active";
          showGestureToast(msg, "thinking");
          return nextMode;
        });
      }
    }
  };

  const handlePreviewVoice = async (voiceName: string) => {
    if (isPreviewLoading) return;
    setIsPreviewLoading(true);
    setPreviewVoiceId(voiceName);
    triggerHaptic(20);
    try {
      const audioBufferData = await generateSpeech(
        "Voice preview operational. Trade intelligence system check.",
        personalityId,
        voiceName
      );
      if (audioBufferData && outputAudioContextRef.current) {
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const decoded = await decodeAudioData(new Uint8Array(audioBufferData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsPreviewLoading(false);
          setPreviewVoiceId(null);
        };
        source.start();
      } else {
        setIsPreviewLoading(false);
        setPreviewVoiceId(null);
      }
    } catch (err) {
      console.error("Voice preview error:", err);
      setIsPreviewLoading(false);
      setPreviewVoiceId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isUserNearBottomRef = useRef<boolean>(true);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const [liveSession, setLiveSession] = useState<{ close: () => void } | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Save conversation history to local storage on every messages update
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history to local storage:', e);
    }
  }, [messages]);

  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceFromBottom <= 140;
    isUserNearBottomRef.current = isNear;
    
    // Only show button if user has scrolled up and there are messages
    if (isNear) {
      setShowScrollBottom(false);
    } else if (messages.length > 0) {
      setShowScrollBottom(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    isUserNearBottomRef.current = true;
    setShowScrollBottom(false);
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.sender === Sender.User;

    // Only auto-scroll if the user is near the bottom or if the user just sent a message
    if (isUserNearBottomRef.current || isUserMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBottom(false);
    } else {
      setShowScrollBottom(true);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // PWA Install & Network listeners
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'live' && hasStarted && !isLive) {
      toggleLiveMode();
    }
  }, [hasStarted]);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowSettings(true);
    }
  };

  const toggleThinking = () => {
    setMode(prev => prev === ModelMode.Thinking ? ModelMode.Pro : ModelMode.Thinking);
  };

  const startApp = () => {
    setHasStarted(true);
    if (outputAudioContextRef.current && outputAudioContextRef.current.state === 'suspended') {
      outputAudioContextRef.current.resume();
    }
    
    if (messages.length === 0) {
      const welcomeSpeech = "System Initialized. Accessing Neural Pathways. I am God AI. The 99% Feature Intelligence. CEEZA is online.";
      playTTS(welcomeSpeech, false);
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob, base64Data: string, mimeType: string) => {
    setShowCeezaVoiceModal(false);
    incrementUserVoiceCount();
    setIsLoading(true);

    const userVoiceMsg: Message = {
      id: Date.now().toString(),
      text: "🎤 [Ceeza Voice Audio Stream]",
      sender: Sender.User,
      timestamp: new Date(),
      attachments: [{
        type: 'audio',
        data: `data:${mimeType};base64,${base64Data}`,
        mimeType
      }]
    };
    setMessages(prev => [...prev, userVoiceMsg]);

    try {
      // Transcribe via Gemini multimodal audio processing
      const transcription = await transcribeAudio(base64Data, mimeType);
      const cleanText = transcription?.trim() || "";

      if (cleanText) {
        setMessages(prev => prev.map(m => m.id === userVoiceMsg.id ? { ...m, text: cleanText } : m));
        
        // Execute Android intent if matching
        const intentResult = detectAndExecuteAndroidIntent(cleanText);
        if (intentResult && intentResult.task) {
          setAssistantTasks(prev => [intentResult.task!, ...prev]);
        }

        incrementUserQueryCount();

        const startTime = performance.now();
        const response = await sendMessageToGemini({
          message: cleanText,
          mode: mode === ModelMode.Thinking ? ModelMode.Thinking : mode,
          personalityId
        });
        const latency = Math.round(performance.now() - startTime);
        setLastLatencyMs(latency);

        let botReply = response.text || "Voice input processed.";
        if (intentResult) {
          botReply = `${intentResult.confirmationText}\n\n${botReply}`;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: botReply,
          sender: Sender.Bot,
          timestamp: new Date(),
          isThinking: mode === ModelMode.Thinking
        };
        setMessages(prev => [...prev, botMsg]);

        if (botReply.length < 500) {
          playTTS(botReply);
        }
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Ceeza Voice Audio captured. Could not transcribe clear speech.",
          sender: Sender.Bot,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error("Failed to process Ceeza voice input:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Error processing Ceeza Voice DSP stream.",
        sender: Sender.Bot,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string, options: { mode: ModelMode; image?: File }) => {
    setIsLoading(true);
    incrementUserQueryCount();
    let imageBase64 = undefined;

    if (options.image) {
      const reader = new FileReader();
      imageBase64 = await new Promise<{ data: string; mimeType: string }>((resolve) => {
        reader.onload = (e) => resolve({ 
          data: (e.target?.result as string).split(',')[1], 
          mimeType: options.image!.type 
        });
        reader.readAsDataURL(options.image!);
      });
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.User,
      timestamp: new Date(),
      attachments: imageBase64 ? [{ type: 'image', data: `data:${imageBase64.mimeType};base64,${imageBase64.data}`, mimeType: imageBase64.mimeType }] : undefined
    };

    setMessages(prev => [...prev, newMessage]);

    // Check for Android Assistant Natural Language Intent
    const intentResult = detectAndExecuteAndroidIntent(text);
    if (intentResult && intentResult.task) {
      setAssistantTasks(prev => [intentResult.task!, ...prev]);
    }

    const startTime = performance.now();

    try {
      const response = await sendMessageToGemini({
        message: text,
        mode: options.mode === ModelMode.Thinking ? ModelMode.Thinking : mode,
        image: imageBase64,
        personalityId: personalityId
      });

      const latency = Math.round(performance.now() - startTime);
      setLastLatencyMs(latency);

      let botText = response.text || "I couldn't generate a response.";
      if (intentResult) {
        botText = `${intentResult.confirmationText}\n\n${botText}`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: Sender.Bot,
        timestamp: new Date(),
        isThinking: options.mode === ModelMode.Thinking,
      };

      setMessages(prev => [...prev, botMessage]);

      if (botText && botText.length < 500) {
        playTTS(botText);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error connecting to Gemini.",
        sender: Sender.Bot,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateMessage = (id: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        const newFeedback = msg.feedback === rating ? undefined : rating;
        return { ...msg, feedback: newFeedback };
      }
      return msg;
    }));
  };

  const playTTS = async (text: string, withEcho: boolean = false) => {
    setIsBotSpeaking(true);
    const audioBufferData = await generateSpeech(text, personalityId, customVoiceName);
    if (audioBufferData && outputAudioContextRef.current) {
        const ctx = outputAudioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        
        const audioBuffer = await decodeAudioData(
            new Uint8Array(audioBufferData), 
            ctx, 
            24000
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        source.onended = () => {
          setIsBotSpeaking(false);
        };

        if (withEcho) {
          const mainGain = ctx.createGain();
          mainGain.gain.value = 0.8;
          const delay = ctx.createDelay();
          delay.delayTime.value = 0.25;
          const feedback = ctx.createGain();
          feedback.gain.value = 0.3;
          const echoGain = ctx.createGain();
          echoGain.gain.value = 0.4;

          source.connect(mainGain);
          mainGain.connect(ctx.destination);
          source.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(echoGain);
          echoGain.connect(ctx.destination);
        } else {
          source.connect(ctx.destination);
        }
        
        source.start();
    } else {
      setIsBotSpeaking(false);
    }
  };

  const toggleLiveMode = async () => {
    if (isLive) {
      if (liveSession) {
        liveSession.close();
        setLiveSession(null);
      }
      setIsLive(false);
      setIsBotSpeaking(false);
      setLiveTranscription(null);
      setAnalyserNode(null);
    } else {
      if (!outputAudioContextRef.current) return;
      setIsLive(true);
      const session = await connectLiveSession(
        outputAudioContextRef.current, 
        (audioBuffer) => {
          if (!outputAudioContextRef.current) return;
          setIsBotSpeaking(true);
          const ctx = outputAudioContextRef.current;
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
            // Check if this was the last scheduled chunk
            if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
              setIsBotSpeaking(false);
            }
          };

          const currentTime = ctx.currentTime;
          const startTime = Math.max(nextStartTimeRef.current, currentTime);
          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        },
        (text, isInterim, sender) => {
          setLiveTranscription({ text, sender });
        },
        () => {
          setIsLive(false);
          setIsBotSpeaking(false);
          setLiveTranscription(null);
          setAnalyserNode(null);
        },
        (analyser) => {
          setAnalyserNode(analyser);
        },
        personalityId,
        customVoiceName
      );
      if (session) {
        setLiveSession(session);
      } else {
        setIsLive(false);
        setAnalyserNode(null);
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear local storage chat history:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white transition-colors duration-300 relative overflow-hidden">
      <div className="atmosphere" />
      <div className="scanline" />

      {/* Offline Toast Notification & Wake Word Listener */}
      <OfflineToast isOnline={isOnline} />
      <WakeWordListener 
        onWakeWordTriggered={toggleLiveMode}
        isLiveActive={isLive}
        isEnabled={isWakeWordEnabled}
        onToggleEnabled={setIsWakeWordEnabled}
      />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3.5 glass sticky top-0 z-50 rounded-b-[2rem] mx-2 mt-2 border-b border-[#F38020]/20">
        <div className="flex-1 flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-[#182236] rounded-full transition-colors text-slate-400 hover:text-[#FAAD3F]"
            title="System Settings"
          >
            <Settings size={20} />
          </motion.button>

          {/* Android Assistant Tasks Quick Trigger */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic(15);
              setShowAndroidModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#34A853]/15 hover:bg-[#34A853]/25 border border-[#34A853]/40 text-[#34A853] text-[10px] font-mono uppercase tracking-wider font-bold transition-all"
            title="Android Assistant Tasks & Intents"
          >
            <Smartphone size={14} className="text-[#34A853]" />
            <span className="hidden sm:inline">Tasks</span>
            {assistantTasks.filter(t => !t.completed).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#34A853] text-black font-mono text-[9px] font-bold flex items-center justify-center">
                {assistantTasks.filter(t => !t.completed).length}
              </span>
            )}
          </motion.button>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <IndicatingOrb 
              status={isLive ? 'live' : isBotSpeaking ? 'speaking' : mode === ModelMode.Thinking ? 'thinking' : 'idle'} 
              size={18} 
              theme={orbTheme}
            />
            <h1 className="text-lg md:text-xl font-bold tracking-tight font-display italic leading-none text-white flex items-center gap-1.5">
              GOD AI <span className="text-[10px] md:text-xs not-italic font-mono text-[#FAAD3F] font-bold bg-[#FAAD3F]/10 px-2 py-0.5 rounded-md border border-[#FAAD3F]/30 uppercase">
                {VOICE_PERSONALITIES[personalityId]?.name || 'CEEZA'}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#FAAD3F] font-semibold font-mono">
              {isLive ? 'Live Vocal Link' : mode === ModelMode.Thinking ? 'Neural Cortex Active' : 'Neural Link Active'}
            </p>
            {lastLatencyMs !== null ? (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                <Zap size={10} className="text-emerald-400 animate-pulse" />
                {lastLatencyMs} ms
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate-400 bg-slate-800/60 border border-white/10 px-2 py-0.5 rounded-full">
                <Zap size={10} className="text-slate-400" />
                Fastest Response
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1.5">
          {/* Active User Account Profile Pill */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic(15);
              setShowUserModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#182338] hover:bg-[#1f2e47] border border-[#FAAD3F]/40 text-white text-[10px] font-mono transition-all shadow-sm"
            title="User Profile & Identity Matrix"
          >
            <span className="text-sm">{currentUser.avatar}</span>
            <span className="hidden md:inline font-bold text-slate-200">{currentUser.name.split(' ')[0]}</span>
            <span className="text-[9px] text-[#FAAD3F] font-bold uppercase hidden lg:inline">
              ({currentUser.role.split(' ')[0]})
            </span>
          </motion.button>

          {messages.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearChat}
              className="p-2 hover:bg-[#182236] rounded-full transition-colors text-slate-400 hover:text-red-400"
              title="Clear Chat History"
            >
              <RotateCcw size={18} />
            </motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-[#182236] rounded-full transition-colors text-slate-400 hover:text-[#FAAD3F]"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-dark w-full max-w-md p-6 md:p-8 rounded-[2rem] border border-[#F38020]/30 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <IndicatingOrb status="idle" size={24} theme={orbTheme} />
                  <h2 className="text-2xl font-bold font-display italic text-white">Neural Config</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#182236] rounded-full transition-colors text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Voice Personality & System Prompt Selector */}
                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#FAAD3F]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#FAAD3F] font-bold flex items-center gap-1.5">
                      <Volume2 size={14} className="text-[#F38020]" />
                      Voice Personality & Prompt
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/10 border border-[#FAAD3F]/30 text-[#FAAD3F] font-bold uppercase">
                      {VOICE_PERSONALITIES[personalityId]?.badge || 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Select a personality to dynamically adjust system prompt behavior, voice timbre, and TTS pitch modulation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.values(VOICE_PERSONALITIES).map((p) => {
                      const isSelected = personalityId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            triggerHaptic(20);
                            setPersonalityId(p.id);
                          }}
                          className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#F38020]/20 to-[#FAAD3F]/10 border-[#FAAD3F] shadow-[0_0_15px_rgba(250,173,63,0.25)]'
                              : 'bg-[#182236]/60 border-white/5 hover:border-white/20 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {p.name}
                            </span>
                            {isSelected && <CheckCircle2 size={14} className="text-[#FAAD3F]" />}
                          </div>
                          <p className="text-[10px] text-slate-300 leading-tight mb-2">
                            {p.description}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-white/5 font-mono text-[9px]">
                            <span className="text-slate-400">Voice: <strong className="text-slate-200">{p.voiceName}</strong></span>
                            <span className="text-[#FAAD3F] font-semibold">{p.pitchLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Orb Color Theme Selector */}
                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#FAAD3F]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#FAAD3F] font-bold flex items-center gap-1.5">
                      <Palette size={14} className="text-[#F38020]" />
                      Orb Color Theme
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/10 border border-[#FAAD3F]/30 text-[#FAAD3F] font-bold uppercase">
                      {orbTheme}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Dynamically update the Orb visualizer plasma colors and high-tech glow accents.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      { id: 'classic', name: 'Classic Gold', color: 'from-[#F38020] via-[#FAAD3F] to-[#4285F4]' },
                      { id: 'emerald', name: 'Emerald Matrix', color: 'from-[#00F5A0] via-[#00D9F6] to-[#0052D4]' },
                      { id: 'nebula', name: 'Nebula Purple', color: 'from-[#B92B27] via-[#1565C0] to-[#8E2DE2]' },
                      { id: 'cyberpunk', name: 'Cyberpunk Neon', color: 'from-[#FF007F] via-[#7928CA] to-[#00DFD8]' },
                    ].map((themeItem) => {
                      const isSelected = orbTheme === themeItem.id;
                      return (
                        <button
                          key={themeItem.id}
                          onClick={() => {
                            triggerHaptic(20);
                            setOrbTheme(themeItem.id as OrbTheme);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#F38020]/20 to-[#FAAD3F]/10 border-[#FAAD3F] shadow-[0_0_15px_rgba(250,173,63,0.25)]'
                              : 'bg-[#182236]/60 border-white/5 hover:border-white/20 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${themeItem.color} ring-1 ring-white/30`} />
                            <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {themeItem.name}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 size={14} className="text-[#FAAD3F]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Voice Customization & Voice Preview */}
                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#4285F4]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#4285F4] font-bold flex items-center gap-1.5">
                      <Sliders size={14} className="text-[#4285F4]" />
                      Advanced Voice Customization
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/30 text-[#4285F4] font-bold uppercase">
                      {customVoiceName || 'Default'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Select specific voice variants for TTS and Live audio, and preview how they sound live.
                  </p>

                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_VOICES.map((v) => {
                      const activeVoice = customVoiceName || VOICE_PERSONALITIES[personalityId]?.voiceName;
                      const isSelected = activeVoice === v.id;
                      const isPreviewing = isPreviewLoading && previewVoiceId === v.id;

                      return (
                        <div
                          key={v.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#4285F4]/15 border-[#4285F4] text-white shadow-[0_0_12px_rgba(66,133,244,0.2)]'
                              : 'bg-[#182236]/50 border-white/5 hover:border-white/15 text-slate-400'
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {v.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                {v.variant}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {v.style}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handlePreviewVoice(v.id)}
                              disabled={isPreviewLoading}
                              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
                                isPreviewing
                                  ? 'bg-[#FAAD3F] text-black border-[#FAAD3F] animate-pulse'
                                  : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                              }`}
                              title="Preview Voice Sample"
                            >
                              {isPreviewing ? (
                                <Volume2 size={13} className="animate-bounce text-black" />
                              ) : (
                                <Volume2 size={13} className="text-[#FAAD3F]" />
                              )}
                              <span className="text-[10px] uppercase hidden sm:inline font-bold">Preview</span>
                            </button>

                            <button
                              onClick={() => {
                                triggerHaptic(20);
                                setCustomVoiceName(v.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all ${
                                isSelected
                                  ? 'bg-[#4285F4] text-white border-[#4285F4]'
                                  : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                              }`}
                            >
                              {isSelected ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#F38020]/20">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#FAAD3F] mb-2 font-bold">Local Conversation Storage</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    Your conversation history is automatically saved to browser local storage ({messages.length} messages saved).
                  </p>
                  <button
                    onClick={() => {
                      clearChat();
                      setShowSettings(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 size={15} />
                    Clear Saved History
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#F38020]/20">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#FAAD3F] mb-2 font-bold">Android Mobile PWA</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    GOD AI is a production-ready Web App with native Android support.
                  </p>
                  
                  {isStandalone ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                      <CheckCircle2 size={16} />
                      App is running as Installed Standalone Android Application.
                    </div>
                  ) : deferredPrompt ? (
                    <button
                      onClick={handleInstallPWA}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F38020] to-[#FAAD3F] hover:from-[#FAAD3F] hover:to-[#F38020] text-black font-bold text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                    >
                      <Download size={16} />
                      Install GOD to Android Home Screen
                    </button>
                  ) : (
                    <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside font-mono">
                      <li>Tap the three dots (⋮) or Share in browser</li>
                      <li>Select "Install app" or "Add to Home screen"</li>
                      <li>Launch GOD directly from your app drawer</li>
                    </ol>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#131a28] border border-[#F38020]/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#FAAD3F] font-bold mb-1 flex items-center gap-1.5">
                      <Mic size={14} className="text-[#4285F4]" />
                      Hands-Free Wake Word
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Say "Hey God" or "OK God" to trigger the Live Session hands-free.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      setIsWakeWordEnabled(!isWakeWordEnabled);
                    }}
                    className={`ml-4 px-3.5 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all border shrink-0 ${
                      isWakeWordEnabled
                        ? 'bg-[#4285F4]/20 border-[#4285F4] text-[#4285F4]'
                        : 'bg-slate-800 border-white/10 text-slate-400'
                    }`}
                  >
                    {isWakeWordEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#131a28] border border-[#F38020]/20">
                  <span className="text-sm font-medium text-white">Appearance</span>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c263b] hover:bg-[#25324d] transition-colors text-xs font-mono uppercase tracking-wider text-[#FAAD3F] font-bold border border-[#F38020]/30"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-center text-slate-500 font-mono uppercase tracking-[0.3em]">
                    GOD AI v1.0.5 • Persistent Storage & Indicating Orb
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Gesture Toast Banner */}
      <AnimatePresence>
        {gestureToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#111726]/95 border border-[#FAAD3F]/40 shadow-2xl backdrop-blur-md text-white font-mono text-xs uppercase tracking-wider font-bold"
          >
            <ArrowLeftRight size={16} className={gestureToast.type === 'clear' ? 'text-red-400' : 'text-[#FAAD3F]'} />
            <span>{gestureToast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main 
        ref={mainRef} 
        onScroll={handleScroll} 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto px-4 md:px-0 pb-36 pt-4 relative"
      >
        <div className="max-w-3xl mx-auto h-full">
          {messages.length === 0 ? (
            <ChatPlaceholder
              userName={currentUser.name.split(' ')[0]}
              onSelectPrompt={(text, opts) => handleSendMessage(text, { mode: opts?.mode || mode, image: opts?.image })}
              onLiveToggle={toggleLiveMode}
              onOpenCeezaVoice={() => setShowCeezaVoiceModal(true)}
              onOpenAssistantTasks={() => setShowAndroidModal(true)}
              mode={mode}
              onToggleThinking={toggleThinking}
            />
          ) : (
            <div className="space-y-1 py-2">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onRate={handleRateMessage} 
                    onImageClick={(src) => setPreviewImageSrc(src)}
                    onPlayTTS={(text) => playTTS(text)}
                  />
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-6 animate-pulse px-2"
                >
                  <div className="glass px-4 py-2.5 rounded-2xl rounded-tl-sm text-slate-300 text-xs font-mono uppercase tracking-widest flex items-center gap-2.5">
                    <IndicatingOrb status="thinking" size={15} theme={orbTheme} />
                    <span>Neural processing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Scroll to Bottom Floating Pill */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            onClick={scrollToBottom}
            className="fixed bottom-32 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-[#111726]/90 text-[#F38020] border border-[#F38020]/40 shadow-2xl text-xs font-mono uppercase font-bold backdrop-blur-md hover:bg-[#182236] transition-all cursor-pointer"
          >
            <ArrowDown size={14} className="animate-bounce text-[#FAAD3F]" />
            <span>Scroll to latest</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Live Voice Neural Audio Session (ChatGPT / Gemini Live Style) */}
      <LiveVoiceSession
        isOpen={isLive}
        onClose={toggleLiveMode}
        isBotSpeaking={isBotSpeaking}
        analyserNode={analyserNode}
        liveTranscription={liveTranscription}
        personalityId={personalityId}
        customVoiceName={customVoiceName}
        onSelectVoice={(voice) => {
          setCustomVoiceName(voice);
        }}
        orbTheme={orbTheme}
        isThinking={mode === ModelMode.Thinking}
      />

      {/* Input Bar */}
      <footer className="fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-black via-black/95 to-transparent pt-4">
        <InputBar 
          onSendMessage={handleSendMessage} 
          onLiveToggle={toggleLiveMode}
          onOpenCeezaVoiceInput={() => setShowCeezaVoiceModal(true)}
          isLive={isLive}
          isLoading={isLoading}
          followUpChips={followUpChips}
          onSelectChip={(chipText) => {
            handleSendMessage(chipText, { 
              mode: mode === ModelMode.Thinking ? ModelMode.Thinking : ModelMode.Pro 
            });
          }}
          currentMode={mode}
          onToggleMode={toggleThinking}
        />
      </footer>

      {/* Full Screen Zoomable Image Preview Modal */}
      <ImagePreviewModal 
        src={previewImageSrc} 
        onClose={() => setPreviewImageSrc(null)} 
      />

      {/* User Account Matrix Modal */}
      <UserAccountModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onCreateUser={handleCreateUser}
      />

      {/* Android Assistant Intent & Task Manager Modal */}
      <AndroidAssistantModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
        tasks={assistantTasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Ceeza Neural Voice Input Processor Modal */}
      <CeezaVoiceInputModal
        isOpen={showCeezaVoiceModal}
        onClose={() => setShowCeezaVoiceModal(false)}
        onAudioRecorded={handleAudioRecorded}
      />
    </div>
  );
};

export default App;
