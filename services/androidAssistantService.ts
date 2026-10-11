/**
 * Android Mobile Digital Assistant Service
 * Provides native hardware & OS-level capabilities for Android phones:
 * - Physical Flashlight / Torch toggle via MediaStream constraints
 * - Screen WakeLock API to keep device awake during voice interactions
 * - Android Intent URL Dispatcher (Alarms, Timers, Maps, Tel, SMS, WhatsApp)
 * - In-App Countdown Timers with synthesized Web Audio chimes
 * - Battery API telemetry & power-saving modes
 * - Web Share Target & Native Share Sheet
 * - Clipboard Reader & Writer
 * - Assistant Haptic Engine
 */

import { triggerHaptic } from '../utils/haptics';

export interface AndroidTimer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  createdAt: number;
}

export type AssistantServiceListener = () => void;

class AndroidAssistantService {
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchOn: boolean = false;
  private wakeLockSentinel: any = null;
  private activeTimers: AndroidTimer[] = [];
  private timerInterval: NodeJS.Timeout | null = null;
  private listeners: Set<AssistantServiceListener> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initTimersFromStorage();
    this.startTimerLoop();
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    return this.audioCtx;
  }

  public subscribe(listener: AssistantServiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('AndroidAssistantService listener error:', err);
      }
    });
  }

  // --- 1. PHYSICAL FLASHLIGHT / TORCH CONTROL (Android Chrome) ---
  public async toggleTorch(targetState?: boolean): Promise<{ success: boolean; isOn: boolean; error?: string }> {
    const nextState = targetState !== undefined ? targetState : !this.isTorchOn;

    try {
      if (nextState) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return { success: false, isOn: false, error: 'Camera API not supported on this device.' };
        }

        // Request environment camera with torch capability
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });

        const track = stream.getVideoTracks()[0];
        if (!track) {
          return { success: false, isOn: false, error: 'No video track found.' };
        }

        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (!capabilities.torch && !('torch' in capabilities)) {
          // If browser reports no torch, fallback gracefully
          console.warn('Torch capability not reported by track, attempting constraint anyway.');
        }

        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }],
          });
          this.torchTrack = track;
          this.isTorchOn = true;
          triggerHaptic([30, 40, 30]);
          this.notify();
          return { success: true, isOn: true };
        } catch (constraintErr: any) {
          // Some Android devices require camera to stay open or don't support torch
          track.stop();
          return { success: false, isOn: false, error: constraintErr?.message || 'Torch constraint failed.' };
        }
      } else {
        // Turn off torch
        if (this.torchTrack) {
          try {
            await (this.torchTrack as any).applyConstraints({
              advanced: [{ torch: false }],
            });
          } catch {}
          this.torchTrack.stop();
          this.torchTrack = null;
        }
        this.isTorchOn = false;
        triggerHaptic(20);
        this.notify();
        return { success: true, isOn: false };
      }
    } catch (err: any) {
      console.warn('Flashlight toggle failed:', err);
      this.isTorchOn = false;
      this.notify();
      return { success: false, isOn: false, error: err?.message || 'Permission denied or torch unavailable.' };
    }
  }

  public getTorchStatus(): boolean {
    return this.isTorchOn;
  }

  // --- 2. SCREEN WAKE LOCK API ---
  public async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
          this.notify();
        });
        this.notify();
        return true;
      }
    } catch (err) {
      console.warn('Screen WakeLock failed:', err);
    }
    return false;
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
      this.notify();
    }
  }

  public isScreenWakeLocked(): boolean {
    return !!this.wakeLockSentinel;
  }

  // --- 3. NATIVE ANDROID SHARING ---
  public async shareContent(title: string, text: string, url?: string): Promise<boolean> {
    triggerHaptic(20);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title,
          text,
          url: url || window.location.href,
        });
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error:', err);
        }
      }
    }

    // Fallback: Copy to clipboard
    return this.writeClipboard(`${title}\n\n${text}${url ? `\n\n${url}` : ''}`);
  }

  // --- 4. CLIPBOARD ACCESS ---
  public async readClipboard(): Promise<string> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        triggerHaptic(15);
        return await navigator.clipboard.readText();
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
    return '';
  }

  public async writeClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        triggerHaptic(20);
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
    return false;
  }

  // --- 5. ANDROID INTENTS DISPATCHER ---
  public dispatchIntent(url: string) {
    triggerHaptic(25);
    try {
      window.location.href = url;
    } catch (e) {
      console.warn('Intent dispatch error:', e);
      window.open(url, '_blank');
    }
  }

  public openMapsSearch(query: string) {
    const encoded = encodeURIComponent(query);
    this.dispatchIntent(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  }

  public openDialer(phoneNumber: string) {
    this.dispatchIntent(`tel:${phoneNumber}`);
  }

  public openSms(phoneNumber: string, body?: string) {
    const encoded = body ? `?body=${encodeURIComponent(body)}` : '';
    this.dispatchIntent(`sms:${phoneNumber}${encoded}`);
  }

  public openWhatsApp(text: string) {
    const encoded = encodeURIComponent(text);
    this.dispatchIntent(`https://wa.me/?text=${encoded}`);
  }

  public openCalendarCreate(title: string, details?: string) {
    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(details || '');
    this.dispatchIntent(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDetails}`);
  }

  // --- 6. IN-APP COUNTDOWN TIMER & ALARM CHIME ---
  private initTimersFromStorage() {
    try {
      const saved = localStorage.getItem('god_ai_android_timers');
      if (saved) {
        this.activeTimers = JSON.parse(saved);
      }
    } catch {}
  }

  private saveTimers() {
    try {
      localStorage.setItem('god_ai_android_timers', JSON.stringify(this.activeTimers));
    } catch {}
    this.notify();
  }

  private startTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      let hasChanges = false;
      this.activeTimers = this.activeTimers.map((t) => {
        if (t.isRunning && t.remainingSeconds > 0) {
          hasChanges = true;
          const next = t.remainingSeconds - 1;
          if (next === 0) {
            this.playAlarmChime();
            triggerHaptic([100, 50, 100, 50, 150]);
          }
          return { ...t, remainingSeconds: next, isRunning: next > 0 };
        }
        return t;
      });

      if (hasChanges) {
        this.saveTimers();
      }
    }, 1000);
  }

  public createTimer(label: string, durationSeconds: number): AndroidTimer {
    const timer: AndroidTimer = {
      id: `timer-${Date.now()}`,
      label: label || 'Timer',
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
      createdAt: Date.now(),
    };
    this.activeTimers.unshift(timer);
    this.saveTimers();
    triggerHaptic(20);
    return timer;
  }

  public toggleTimer(id: string) {
    this.activeTimers = this.activeTimers.map((t) => {
      if (t.id === id) {
        return { ...t, isRunning: !t.isRunning };
      }
      return t;
    });
    this.saveTimers();
    triggerHaptic(15);
  }

  public resetTimer(id: string) {
    this.activeTimers = this.activeTimers.map((t) => {
      if (t.id === id) {
        return { ...t, remainingSeconds: t.durationSeconds, isRunning: false };
      }
      return t;
    });
    this.saveTimers();
    triggerHaptic(15);
  }

  public deleteTimer(id: string) {
    this.activeTimers = this.activeTimers.filter((t) => t.id !== id);
    this.saveTimers();
    triggerHaptic(15);
  }

  public getTimers(): AndroidTimer[] {
    return [...this.activeTimers];
  }

  /**
   * Synthesizes an alert chime with Web Audio API (no external sound file needed)
   */
  public playAlarmChime() {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Alarm chime error:', e);
    }
  }
}

export const androidAssistantService = new AndroidAssistantService();
