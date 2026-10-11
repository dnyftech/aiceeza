import { KokoroTTS, env } from 'kokoro-js';

export interface KokoroVoiceProfile {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British';
  traits: string;
  grade: string;
  targetQuality: string;
  description: string;
  sampleText: string;
}

export type KokoroEngineState = 'unloaded' | 'loading' | 'ready' | 'synthesizing' | 'speaking' | 'error';

export interface KokoroProgress {
  status: string;
  file?: string;
  progress: number; // 0 to 100
  loaded?: number;
  total?: number;
}

export interface KokoroServiceStatus {
  state: KokoroEngineState;
  progress: KokoroProgress | null;
  activeVoice: string;
  speed: number;
  error: string | null;
  device: 'wasm' | 'webgpu';
  isModelCached: boolean;
}

export type KokoroListener = (status: KokoroServiceStatus) => void;

export const KOKORO_VOICES: KokoroVoiceProfile[] = [
  {
    id: 'af_heart',
    name: 'Heart',
    gender: 'Female',
    accent: 'American',
    traits: '❤️ Warm & Expressive',
    grade: 'A',
    targetQuality: 'High-Fi Master',
    description: 'Flagship warm, empathic, and highly expressive American female voice with rich dynamic range.',
    sampleText: 'Welcome to God AI. The neural pathways are fully synchronized and ready for command.'
  },
  {
    id: 'af_bella',
    name: 'Bella',
    gender: 'Female',
    accent: 'American',
    traits: '🔥 Dynamic & Vibrant',
    grade: 'A-',
    targetQuality: 'Stage Presence',
    description: 'Energetic, confident, and punchy delivery suitable for high-energy assistance.',
    sampleText: 'All systems are running at peak velocity. Let us build something extraordinary.'
  },
  {
    id: 'af_nicole',
    name: 'Nicole',
    gender: 'Female',
    accent: 'American',
    traits: '🎧 Studio Clarity',
    grade: 'B-',
    targetQuality: 'Clear Broadcast',
    description: 'Crisp studio diction with crystal-clear articulation, optimal for complex technical explanations.',
    sampleText: 'Analyzing code structure, dependencies, and execution telemetry across the sandbox.'
  },
  {
    id: 'af_nova',
    name: 'Nova',
    gender: 'Female',
    accent: 'American',
    traits: '✨ Modern Neural',
    grade: 'C',
    targetQuality: 'Balanced AI',
    description: 'Modern, clean, smooth synthetic tone with balanced cadence and rhythm.',
    sampleText: 'Quantum computing leverages superposition and entanglement to solve exponential problems.'
  },
  {
    id: 'af_sarah',
    name: 'Sarah',
    gender: 'Female',
    accent: 'American',
    traits: '🌿 Calm & Grounded',
    grade: 'C+',
    targetQuality: 'Serene Presence',
    description: 'Gentle, balanced, and calming voice with smooth natural pauses.',
    sampleText: 'Take a breath. Let us methodically step through each phase of the plan.'
  },
  {
    id: 'af_sky',
    name: 'Sky',
    gender: 'Female',
    accent: 'American',
    traits: '☁️ Gentle Melody',
    grade: 'C-',
    targetQuality: 'Ambient Soft',
    description: 'Soothing and light delivery, designed for relaxed hands-free conversational sessions.',
    sampleText: 'The night sky reveals infinite potential for those curious enough to observe.'
  },
  {
    id: 'am_adam',
    name: 'Adam',
    gender: 'Male',
    accent: 'American',
    traits: '⚡ Deep & Resonant',
    grade: 'B',
    targetQuality: 'Authoritative Core',
    description: 'Deep, rich resonant baritone voice with commanding presence and clarity.',
    sampleText: 'System core operational. Executing full-spectrum telemetry and security validation.'
  },
  {
    id: 'am_michael',
    name: 'Michael',
    gender: 'Male',
    accent: 'American',
    traits: '🎙️ Grounded & Natural',
    grade: 'C+',
    targetQuality: 'Conversational',
    description: 'Approachable, friendly American male voice with conversational warmth.',
    sampleText: 'I reviewed your repository architecture and found three key opportunities for optimization.'
  },
  {
    id: 'am_fenrir',
    name: 'Fenrir',
    gender: 'Male',
    accent: 'American',
    traits: '🛡️ Strong & Confident',
    grade: 'C+',
    targetQuality: 'Epic Resonant',
    description: 'Powerful, steady, and resolute tone with deliberate vocal weight.',
    sampleText: 'Defenses verified, sandboxes isolated, neural link established. Ready for battle.'
  },
  {
    id: 'am_echo',
    name: 'Echo',
    gender: 'Male',
    accent: 'American',
    traits: '📡 Technical Precision',
    grade: 'C',
    targetQuality: 'Synthetic Crisp',
    description: 'Direct, focused, and rhythmically precise voice tailored for technical readouts.',
    sampleText: 'Telemetry packets routed through port 3000. Zero packet drop detected.'
  },
  {
    id: 'bf_emma',
    name: 'Emma',
    gender: 'Female',
    accent: 'British',
    traits: '🇬🇧 British Expressive',
    grade: 'B-',
    targetQuality: 'Articulate British',
    description: 'Articulate British female voice with polished phonetics and warm cadence.',
    sampleText: 'Brilliant! I have prepared the summary and structured the responses meticulously.'
  },
  {
    id: 'bf_isabella',
    name: 'Isabella',
    gender: 'Female',
    accent: 'British',
    traits: '🎭 Refined & Eloquent',
    grade: 'C',
    targetQuality: 'Classical Elegance',
    description: 'Sophisticated and classical British tone with melodic phrasing.',
    sampleText: 'Shall we examine the architectural diagrams and explore the design patterns?'
  },
  {
    id: 'bm_george',
    name: 'George',
    gender: 'Male',
    accent: 'British',
    traits: '🎩 British Distinguished',
    grade: 'C',
    targetQuality: 'Gentleman Cadence',
    description: 'Distinguished British male voice with measured tempo and refined composure.',
    sampleText: 'Splendid progress. The deployment workflow has compiled cleanly on the server.'
  },
  {
    id: 'bm_lewis',
    name: 'Lewis',
    gender: 'Male',
    accent: 'British',
    traits: '☕ Casual British',
    grade: 'C+',
    targetQuality: 'Modern London',
    description: 'Modern, casual British male delivery with engaging conversational flow.',
    sampleText: 'Right then, let us dive straight into the code and see what we can improve.'
  }
];

class KokoroVoiceEngine {
  private ttsInstance: KokoroTTS | null = null;
  private loadPromise: Promise<KokoroTTS> | null = null;
  private listeners: Set<KokoroListener> = new Set();
  private status: KokoroServiceStatus = {
    state: 'unloaded',
    progress: null,
    activeVoice: 'af_heart',
    speed: 1.0,
    error: null,
    device: 'wasm',
    isModelCached: false,
  };

  constructor() {
    this.initFromStorage();
    this.checkIfCached();
  }

  private initFromStorage() {
    try {
      const savedVoice = localStorage.getItem('god_ai_kokoro_voice');
      if (savedVoice && KOKORO_VOICES.some(v => v.id === savedVoice)) {
        this.status.activeVoice = savedVoice;
      }
      const savedSpeed = localStorage.getItem('god_ai_kokoro_speed');
      if (savedSpeed) {
        const parsed = parseFloat(savedSpeed);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
          this.status.speed = parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private async checkIfCached() {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open('transformers-cache').catch(() => null);
        if (cache) {
          const keys = await cache.keys();
          if (keys.length > 0) {
            this.updateStatus({ isModelCached: true });
          }
        }
      }
    } catch {
      // Ignore cache check errors
    }
  }

  public subscribe(listener: KokoroListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private updateStatus(patch: Partial<KokoroServiceStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((fn) => {
      try {
        fn(this.status);
      } catch (err) {
        console.error('KokoroService listener error:', err);
      }
    });
  }

  public getStatus(): KokoroServiceStatus {
    return { ...this.status };
  }

  public setVoice(voiceId: string) {
    if (KOKORO_VOICES.some(v => v.id === voiceId)) {
      this.updateStatus({ activeVoice: voiceId });
      try {
        localStorage.setItem('god_ai_kokoro_voice', voiceId);
      } catch {}
    }
  }

  public setSpeed(speed: number) {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    this.updateStatus({ speed: clamped });
    try {
      localStorage.setItem('god_ai_kokoro_speed', clamped.toString());
    } catch {}
  }

  /**
   * Loads or gets the cached Kokoro-82M model in the browser via WebAssembly/WebGPU.
   */
  public async loadModel(): Promise<KokoroTTS> {
    if (this.ttsInstance) {
      return this.ttsInstance;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.updateStatus({
      state: 'loading',
      error: null,
      progress: { status: 'Initiating Kokoro-82M...', progress: 0 }
    });

    // Detect WebGPU availability
    const hasWebGPU = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
    const device = hasWebGPU ? 'webgpu' : 'wasm';
    this.updateStatus({ device });

    const modelId = 'onnx-community/Kokoro-82M-v1.0-ONNX';

    this.loadPromise = (async () => {
      try {
        const tts = await KokoroTTS.from_pretrained(modelId, {
          dtype: 'q8', // Quantized 8-bit for fast download and small memory footprint
          device: device as any,
          progress_callback: (progressInfo: any) => {
            if (progressInfo) {
              const rawProgress = typeof progressInfo.progress === 'number' 
                ? Math.round(progressInfo.progress) 
                : 0;
              
              this.updateStatus({
                progress: {
                  status: progressInfo.status || 'Downloading model weights...',
                  file: progressInfo.file,
                  progress: Math.min(100, Math.max(0, rawProgress)),
                  loaded: progressInfo.loaded,
                  total: progressInfo.total,
                }
              });
            }
          }
        });

        this.ttsInstance = tts;
        this.updateStatus({
          state: 'ready',
          progress: { status: 'Kokoro-82M Engine Ready', progress: 100 },
          isModelCached: true,
          error: null,
        });

        return tts;
      } catch (err: any) {
        console.error('Failed to load Kokoro TTS model:', err);
        this.loadPromise = null;
        this.updateStatus({
          state: 'error',
          error: err?.message || 'Failed to download or initialize Kokoro-82M neural engine.',
          progress: null,
        });
        throw err;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Synthesize text to raw audio using Kokoro-82M neural model.
   * Cleans tags and markdown, phonemizes, and generates Float32 audio samples at 24000Hz.
   */
  public async synthesize(
    text: string, 
    customVoice?: string, 
    customSpeed?: number
  ): Promise<{ audioSamples: Float32Array; samplingRate: number }> {
    const tts = await this.loadModel();
    const voiceToUse = (customVoice || this.status.activeVoice) as any;
    const speedToUse = customSpeed !== undefined ? customSpeed : this.status.speed;

    this.updateStatus({ state: 'synthesizing' });

    // Clean markdown and formatting symbols for natural phonemization
    const cleanedText = text
      .replace(/```[\s\S]*?```/g, '') // strip code blocks
      .replace(/`([^`]+)`/g, '$1')     // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[*#_~]/g, '')         // markdown formatting
      .replace(/\[pause\]/gi, ', ')
      .replace(/\[short pause\]/gi, ', ')
      .replace(/\[confident\]/gi, '')
      .replace(/\[thoughtful\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      this.updateStatus({ state: 'ready' });
      throw new Error('Input text is empty after speech preprocessing.');
    }

    try {
      // Truncate to reasonable chunk size if very long for interactive latency
      const targetText = cleanedText.length > 600 ? cleanedText.slice(0, 600) + '...' : cleanedText;
      const rawAudio = await tts.generate(targetText, {
        voice: voiceToUse,
        speed: speedToUse,
      });

      this.updateStatus({ state: 'ready' });

      return {
        audioSamples: rawAudio.audio,
        samplingRate: rawAudio.sampling_rate || 24000,
      };
    } catch (err: any) {
      this.updateStatus({ 
        state: 'ready',
        error: `Speech synthesis error: ${err?.message || 'Unknown error'}`
      });
      throw err;
    }
  }

  public isReady(): boolean {
    return this.status.state === 'ready' && !!this.ttsInstance;
  }
}

// Export singleton instance
export const kokoroService = new KokoroVoiceEngine();
