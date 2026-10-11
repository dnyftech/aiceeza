import { VoicePersonalityId } from '../types';
import { VOICE_PERSONALITIES, AVAILABLE_VOICES, formatTextForExpressiveSpeech, generateSpeech } from './geminiService';
import { decodeAudioData } from './audio';
import { kokoroService } from './kokoroService';

export type TTSEngineKind = 'kokoro' | 'neural_gemini' | 'browser_speech' | 'idle';
export type PreferredEngineSetting = 'auto' | 'kokoro' | 'gemini' | 'browser';

export interface VoiceEngineStatus {
  isSpeaking: boolean;
  isSynthesizing: boolean;
  currentEngine: TTSEngineKind;
  preferredEngine: PreferredEngineSetting;
  activeVoice: string;
  volume: number; // 0.0 - 1.0
  rate: number;   // 0.5 - 2.0
  pitch: number;  // 0.5 - 2.0
  currentText: string | null;
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

  // State
  private status: VoiceEngineStatus = {
    isSpeaking: false,
    isSynthesizing: false,
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

      this.updateStatus({
        preferredEngine: this.preferredEngine,
        volume: this.volume,
        rate: this.rate,
        pitch: this.pitch,
      });
    } catch {
      // Ignore localStorage errors
    }
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
   * Stop any currently active speech playback immediately.
   */
  public stop() {
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
   */
  public async speak(
    text: string,
    options?: {
      personalityId?: VoicePersonalityId;
      customVoiceName?: string;
      withEcho?: boolean;
      engineOverride?: 'kokoro' | 'gemini' | 'browser';
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<boolean> {
    const cleanText = text.trim();
    if (!cleanText) return false;

    // Stop any ongoing playback
    this.stop();

    const targetEngine = options?.engineOverride || this.preferredEngine;
    const personalityId = options?.personalityId || 'ceeza';
    const personality = VOICE_PERSONALITIES[personalityId] || VOICE_PERSONALITIES.ceeza;
    const selectedVoice = options?.customVoiceName || personality.voiceName || 'Zephyr';

    this.updateStatus({
      isSpeaking: true,
      isSynthesizing: true,
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
        source.playbackRate.value = 1.0; // speed handled by Kokoro synthesizer

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
          // If explicitly selected, report error but fallback cleanly
          options?.onError?.(kokoroErr);
        }
      }
    }

    // 2. High-Fidelity Gemini Neural Voice Engine
    if (targetEngine !== 'browser') {
      try {
        const audioBufferData = await generateSpeech(cleanText, personalityId, selectedVoice);

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
        console.warn('Gemini Neural Voice synthesis fallback to Browser Speech Engine:', neuralErr);
      }
    }

    // 3. Fallback to Browser Built-in Web Speech API Engine
    return this.speakWithBrowserEngine(cleanText, selectedVoice, options);
  }

  /**
   * Browser SpeechSynthesis fallback engine with natural cadence and punctuation tags
   */
  private speakWithBrowserEngine(
    text: string,
    voiceName: string,
    options?: {
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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
        this.updateStatus({
          isSpeaking: false,
          currentEngine: 'idle',
          currentText: null,
        });
        options?.onEnd?.();
      };

      utterance.onerror = (err) => {
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
