import { VoicePersonalityId } from '../types';
import { VOICE_PERSONALITIES, AVAILABLE_VOICES, formatTextForExpressiveSpeech, generateSpeech } from './geminiService';
import { decodeAudioData } from './audio';
import { kokoroService } from './kokoroService';
import { triggerHaptic } from '../utils/haptics';

export type TTSEngineKind = 'kokoro' | 'neural_gemini' | 'browser_speech' | 'idle';
export type PreferredEngineSetting = 'auto' | 'kokoro' | 'gemini' | 'browser';

export interface VoiceEngineStatus {
  isSpeaking: boolean;
  isSynthesizing: boolean;
  isInterruptible: boolean;
  currentEngine: TTSEngineKind;
  preferredEngine: PreferredEngineSetting;
  activeVoice: string;
  volume: number; // 0.0 - 1.0
  rate: number;   // 0.5 - 2.0
  pitch: number;  // 0.5 - 2.0
  currentText: string | null;
}

export interface SpeakOptions {
  personalityId?: VoicePersonalityId;
  customVoiceName?: string;
  withEcho?: boolean;
  engineOverride?: 'kokoro' | 'gemini' | 'browser';
  interruptible?: boolean;
  onEnd?: () => void;
  onInterrupted?: (reason?: string) => void;
  onError?: (err: any) => void;
}

export type VoiceEngineListener = (status: VoiceEngineStatus) => void;

class BuiltInVoiceEngine {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private listeners: Set<VoiceEngineListener> = new Set();
  
  // Settings & config
  private volume: number = 1.0;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private preferredEngine: PreferredEngineSetting = 'auto';
  private interruptibleDefault: boolean = true;

  // Active playback state
  private activeInterruptible: boolean = false;
  private currentOnInterrupted: ((reason?: string) => void) | null = null;
  private currentOnEnd: (() => void) | null = null;

  // State
  private status: VoiceEngineStatus = {
    isSpeaking: false,
    isSynthesizing: false,
    isInterruptible: true,
    currentEngine: 'idle',
    preferredEngine: 'auto',
    activeVoice: 'Zephyr',
    volume: 1.0,
    rate: 1.0,
    pitch: 1.0,
    currentText: null,
  };

  constructor() {
    this.initFromStorage();
    this.attachGlobalInterruptionListeners();
  }

  private initFromStorage() {
    try {
      const savedEngine = localStorage.getItem('god_ai_tts_engine') as PreferredEngineSetting;
      if (savedEngine && ['auto', 'kokoro', 'gemini', 'browser'].includes(savedEngine)) {
        this.preferredEngine = savedEngine;
      }

      const savedVol = localStorage.getItem('god_ai_tts_volume');
      if (savedVol) this.volume = parseFloat(savedVol);

      const savedRate = localStorage.getItem('god_ai_tts_rate');
      if (savedRate) this.rate = parseFloat(savedRate);

      const savedPitch = localStorage.getItem('god_ai_tts_pitch');
      if (savedPitch) this.pitch = parseFloat(savedPitch);

      const savedInterruptible = localStorage.getItem('god_ai_tts_interruptible');
      if (savedInterruptible !== null) {
        this.interruptibleDefault = savedInterruptible === 'true';
      }

      this.updateStatus({
        preferredEngine: this.preferredEngine,
        volume: this.volume,
        rate: this.rate,
        pitch: this.pitch,
        isInterruptible: this.interruptibleDefault,
      });
    } catch {
      // Ignore localStorage errors
    }
  }

  private attachGlobalInterruptionListeners() {
    if (typeof window === 'undefined') return;

    // Listen for custom wake-word / mic events
    window.addEventListener('god_ai_mic_active', () => {
      this.notifyMicrophoneActivity();
    });

    window.addEventListener('god_ai_wake_word', (e: any) => {
      this.notifyWakeWord(e?.detail?.phrase);
    });

    window.addEventListener('voice-engine-interrupt', (e: any) => {
      this.interrupt(e?.detail?.reason || 'event_interrupt');
    });
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    }
    return this.audioContext;
  }

  public getAnalyser(): AnalyserNode {
    const ctx = this.getAudioContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
    }
    return this.analyser;
  }

  public subscribe(listener: VoiceEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private updateStatus(patch: Partial<VoiceEngineStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((fn) => {
      try {
        fn(this.status);
      } catch (err) {
        console.error('VoiceEngine listener error:', err);
      }
    });
  }

  public getStatus(): VoiceEngineStatus {
    return { ...this.status };
  }

  public getPreferredEngine(): PreferredEngineSetting {
    return this.preferredEngine;
  }

  public setPreferredEngine(engine: PreferredEngineSetting) {
    this.preferredEngine = engine;
    try {
      localStorage.setItem('god_ai_tts_engine', engine);
    } catch {}
    this.updateStatus({ preferredEngine: engine });
  }

  public setInterruptibleDefault(enabled: boolean) {
    this.interruptibleDefault = enabled;
    try {
      localStorage.setItem('god_ai_tts_interruptible', enabled.toString());
    } catch {}
    this.updateStatus({ isInterruptible: enabled });
  }

  public isInterruptibleActive(): boolean {
    return this.status.isSpeaking && this.activeInterruptible;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.currentGain) {
      this.currentGain.gain.setValueAtTime(this.volume, this.getAudioContext().currentTime);
    }
    try {
      localStorage.setItem('god_ai_tts_volume', this.volume.toString());
    } catch {}
    this.updateStatus({ volume: this.volume });
  }

  public setRate(val: number) {
    this.rate = Math.max(0.5, Math.min(2.0, val));
    try {
      localStorage.setItem('god_ai_tts_rate', this.rate.toString());
    } catch {}
    this.updateStatus({ rate: this.rate });
  }

  public setPitch(val: number) {
    this.pitch = Math.max(0.5, Math.min(2.0, val));
    try {
      localStorage.setItem('god_ai_tts_pitch', this.pitch.toString());
    } catch {}
    this.updateStatus({ pitch: this.pitch });
  }

  /**
   * Immediately stops audio playback when user microphone input or wake word is detected
   */
  public interrupt(reason: string = 'user_interruption'): boolean {
    if (!this.status.isSpeaking && !this.status.isSynthesizing) {
      return false;
    }

    if (!this.activeInterruptible) {
      return false;
    }

    triggerHaptic(20);
    const cb = this.currentOnInterrupted;
    this.stop();

    if (cb) {
      try {
        cb(reason);
      } catch (e) {
        console.error('Interrupt callback error:', e);
      }
    }
    return true;
  }

  /**
   * Called when microphone voice activity is detected while speech is playing.
   */
  public notifyMicrophoneActivity(level?: number): boolean {
    if (this.isInterruptibleActive()) {
      if (level === undefined || level > 12) {
        return this.interrupt('microphone_input_detected');
      }
    }
    return false;
  }

  /**
   * Called when hands-free wake word is detected ("Hey God", "OK God", etc.).
   */
  public notifyWakeWord(phrase?: string): boolean {
    if (this.isInterruptibleActive() || this.status.isSpeaking) {
      return this.interrupt(phrase ? `wake_word_${phrase}` : 'wake_word_detected');
    }
    return false;
  }

  /**
   * Stop any currently active speech playback immediately.
   */
  public stop() {
    this.activeInterruptible = false;
    this.currentOnInterrupted = null;
    this.currentOnEnd = null;

    // 1. Stop Web Audio Buffer Source
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }

    // 2. Stop Browser Web Speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.updateStatus({
      isSpeaking: false,
      isSynthesizing: false,
      currentEngine: 'idle',
      currentText: null,
    });
  }

  /**
   * Main speech playback function:
   * Synthesizes and speaks text using either Kokoro-82M Neural Engine,
   * Gemini 3.8 Neural Flash TTS, or Browser SpeechSynthesis.
   * Includes interruptible mode that immediately halts playback on mic input or wake word.
   */
  public async speak(
    text: string,
    options?: SpeakOptions
  ): Promise<boolean> {
    const cleanText = text.trim();
    if (!cleanText) return false;

    // Stop any ongoing playback
    this.stop();

    const isInterruptible = options?.interruptible !== undefined ? options.interruptible : this.interruptibleDefault;
    this.activeInterruptible = isInterruptible;
    this.currentOnInterrupted = options?.onInterrupted || null;
    this.currentOnEnd = options?.onEnd || null;

    const targetEngine = options?.engineOverride || this.preferredEngine;
    const personalityId = options?.personalityId || 'ceeza';
    const personality = VOICE_PERSONALITIES[personalityId] || VOICE_PERSONALITIES.ceeza;
    const selectedVoice = options?.customVoiceName || personality.voiceName || 'Zephyr';

    this.updateStatus({
      isSpeaking: true,
      isSynthesizing: true,
      isInterruptible,
      activeVoice: selectedVoice,
      currentText: cleanText,
    });

    // 1. If Kokoro engine is requested or preferred, synthesize with Kokoro-82M
    if (targetEngine === 'kokoro' || (targetEngine === 'auto' && kokoroService.isReady())) {
      try {
        const kokoroStatus = kokoroService.getStatus();
        const kokoroVoice = kokoroStatus.activeVoice;

        const { audioSamples, samplingRate } = await kokoroService.synthesize(
          cleanText, 
          kokoroVoice, 
          this.rate
        );

        if (!this.status.isSpeaking) {
          // Playback was cancelled or interrupted during synthesis
          return false;
        }

        this.updateStatus({
          isSynthesizing: false,
          currentEngine: 'kokoro',
          activeVoice: `Kokoro (${kokoroVoice})`,
        });

        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Create AudioBuffer directly from Float32Array
        const audioBuffer = ctx.createBuffer(1, audioSamples.length, samplingRate);
        audioBuffer.getChannelData(0).set(audioSamples);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 1.0;

        const gainNode = ctx.createGain();
        gainNode.gain.value = this.volume;
        this.currentGain = gainNode;

        const analyser = this.getAnalyser();

        if (options?.withEcho) {
          const delay = ctx.createDelay();
          delay.delayTime.value = 0.22;
          const feedback = ctx.createGain();
          feedback.gain.value = 0.28;
          const echoGain = ctx.createGain();
          echoGain.gain.value = 0.35;

          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(ctx.destination);

          source.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(echoGain);
          echoGain.connect(ctx.destination);
        } else {
          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(ctx.destination);
        }

        this.currentSource = source;

        source.onended = () => {
          this.currentSource = null;
          this.activeInterruptible = false;
          this.updateStatus({
            isSpeaking: false,
            currentEngine: 'idle',
            currentText: null,
          });
          options?.onEnd?.();
        };

        source.start();
        return true;
      } catch (kokoroErr) {
        console.warn('Kokoro Voice Engine failed or aborted, falling back:', kokoroErr);
        if (targetEngine === 'kokoro') {
          options?.onError?.(kokoroErr);
        }
      }
    }

    // 2. High-Fidelity Gemini Neural Voice Engine
    if (targetEngine !== 'browser') {
      try {
        const audioBufferData = await generateSpeech(cleanText, personalityId, selectedVoice);

        if (!this.status.isSpeaking) {
          // Playback was cancelled or interrupted during synthesis
          return false;
        }

        if (audioBufferData) {
          this.updateStatus({
            isSynthesizing: false,
            currentEngine: 'neural_gemini',
            activeVoice: selectedVoice,
          });

          const ctx = this.getAudioContext();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          const decodedBuffer = await decodeAudioData(
            new Uint8Array(audioBufferData),
            ctx,
            24000,
            1
          );

          if (!this.status.isSpeaking) return false;

          const source = ctx.createBufferSource();
          source.buffer = decodedBuffer;
          source.playbackRate.value = this.rate;

          const gainNode = ctx.createGain();
          gainNode.gain.value = this.volume;
          this.currentGain = gainNode;

          const analyser = this.getAnalyser();

          if (options?.withEcho) {
            const delay = ctx.createDelay();
            delay.delayTime.value = 0.22;
            const feedback = ctx.createGain();
            feedback.gain.value = 0.28;
            const echoGain = ctx.createGain();
            echoGain.gain.value = 0.35;

            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(ctx.destination);

            source.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(echoGain);
            echoGain.connect(ctx.destination);
          } else {
            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(ctx.destination);
          }

          this.currentSource = source;

          source.onended = () => {
            this.currentSource = null;
            this.activeInterruptible = false;
            this.updateStatus({
              isSpeaking: false,
              currentEngine: 'idle',
              currentText: null,
            });
            options?.onEnd?.();
          };

          source.start();
          return true;
        }
      } catch (neuralErr) {
        console.warn('Gemini Neural Voice synthesis notice, falling back to Browser Speech Engine:', neuralErr);
      }
    }

    if (!this.status.isSpeaking) return false;

    // 3. Fallback to Browser Built-in Web Speech API Engine
    return this.speakWithBrowserEngine(cleanText, selectedVoice, options);
  }

  /**
   * Browser SpeechSynthesis fallback engine with natural cadence and punctuation tags
   */
  private speakWithBrowserEngine(
    text: string,
    voiceName: string,
    options?: SpeakOptions
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.activeInterruptible = false;
      this.updateStatus({
        isSpeaking: false,
        isSynthesizing: false,
        currentEngine: 'idle',
        currentText: null,
      });
      options?.onError?.(new Error('Speech synthesis not supported on this platform.'));
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean pauses/tags to commas/pauses for native speech synth
      const formatted = formatTextForExpressiveSpeech(text).replace(/\[[^\]]+\]/g, ', ');
      const utterance = new SpeechSynthesisUtterance(formatted.slice(0, 500));

      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      // Match voice by preference
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const found = voices.find(
          (v) =>
            v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
            v.lang.startsWith('en')
        );
        if (found) {
          utterance.voice = found;
        }
      }

      this.updateStatus({
        isSpeaking: true,
        isSynthesizing: false,
        currentEngine: 'browser_speech',
        activeVoice: utterance.voice?.name || 'Browser Voice',
      });

      utterance.onend = () => {
        this.activeInterruptible = false;
        this.updateStatus({
          isSpeaking: false,
          currentEngine: 'idle',
          currentText: null,
        });
        options?.onEnd?.();
      };

      utterance.onerror = (err) => {
        this.activeInterruptible = false;
        this.updateStatus({
          isSpeaking: false,
          currentEngine: 'idle',
          currentText: null,
        });
        options?.onError?.(err);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      this.activeInterruptible = false;
      this.updateStatus({
        isSpeaking: false,
        isSynthesizing: false,
        currentEngine: 'idle',
        currentText: null,
      });
      options?.onError?.(err);
      return false;
    }
  }
}

// Export singleton engine instance
export const voiceEngine = new BuiltInVoiceEngine();
