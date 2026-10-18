import { AssistantTask, AndroidIntentType } from '../types';
import { voiceEngine } from './voiceEngine';
import { triggerHaptic } from '../utils/haptics';

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  intervalId?: any;
}

export type TaskReminderCallback = (task: AssistantTask, mode: 'notification' | 'tts' | 'both') => void;

class AndroidAssistantService {
  private torchStream: MediaStream | null = null;
  private isTorchOn: boolean = false;
  private timers: Map<string, ActiveTimer> = new Map();
  private timerListeners: Set<(timers: ActiveTimer[]) => void> = new Set();
  private reminderListeners: Set<TaskReminderCallback> = new Set();
  private monitoredTasks: Map<string, { task: AssistantTask; triggered: boolean; dueTimestamp: number }> = new Map();
  private reminderCheckInterval: any = null;
  private hasRequestedNotificationPermission: boolean = false;

  constructor() {
    this.startReminderChecker();
  }

  // -------------------------------------------------------------
  // Hardware Flashlight / Torch via Camera Constraints
  // -------------------------------------------------------------
  public async toggleTorch(targetState?: boolean): Promise<boolean> {
    const nextState = targetState !== undefined ? targetState : !this.isTorchOn;

    try {
      if (nextState) {
        if (!this.torchStream) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              advanced: [{ torch: true } as any],
            } as any,
          });
          this.torchStream = stream;
        }

        const videoTrack = this.torchStream?.getVideoTracks()[0];
        if (videoTrack) {
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: true }],
          });
        }
        this.isTorchOn = true;
        triggerHaptic([30, 50, 30]);
        return true;
      } else {
        if (this.torchStream) {
          const videoTrack = this.torchStream.getVideoTracks()[0];
          if (videoTrack) {
            try {
              await (videoTrack as any).applyConstraints({
                advanced: [{ torch: false }],
              });
            } catch {}
          }
          this.torchStream.getTracks().forEach((t) => t.stop());
          this.torchStream = null;
        }
        this.isTorchOn = false;
        triggerHaptic(20);
        return false;
      }
    } catch (err) {
      console.warn('Physical camera torch not supported on this browser or platform. Simulating software toggle state:', err);
      this.isTorchOn = nextState;
      triggerHaptic(20);
      return this.isTorchOn;
    }
  }

  public getTorchState(): boolean {
    return this.isTorchOn;
  }

  // -------------------------------------------------------------
  // Active Countdown Timers
  // -------------------------------------------------------------
  public createTimer(label: string, durationSeconds: number): ActiveTimer {
    const id = `timer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timer: ActiveTimer = {
      id,
      label,
      totalSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
    };

    timer.intervalId = setInterval(() => {
      timer.remainingSeconds -= 1;
      this.notifyTimerListeners();

      if (timer.remainingSeconds <= 0) {
        clearInterval(timer.intervalId);
        timer.isRunning = false;
        this.onTimerExpired(timer);
      }
    }, 1000);

    this.timers.set(id, timer);
    this.notifyTimerListeners();
    return timer;
  }

  public cancelTimer(id: string) {
    const t = this.timers.get(id);
    if (t?.intervalId) {
      clearInterval(t.intervalId);
    }
    this.timers.delete(id);
    this.notifyTimerListeners();
  }

  public subscribeTimers(callback: (timers: ActiveTimer[]) => void): () => void {
    this.timerListeners.add(callback);
    callback(Array.from(this.timers.values()));
    return () => this.timerListeners.delete(callback);
  }

  private notifyTimerListeners() {
    const list = Array.from(this.timers.values());
    this.timerListeners.forEach((fn) => fn(list));
  }

  private onTimerExpired(timer: ActiveTimer) {
    this.playChimeTone();
    triggerHaptic([100, 100, 100, 200]);

    // Local Notification
    this.showBrowserNotification(`Timer Finished: ${timer.label}`, {
      body: `Your ${timer.totalSeconds}s countdown timer has reached zero.`,
    });

    // TTS announcement
    voiceEngine.speak(`Timer alert! Your countdown for ${timer.label} has completed.`, {
      interruptible: true,
    });
  }

  // -------------------------------------------------------------
  // Task Reminder & Deadline Monitoring Feature
  // -------------------------------------------------------------
  public subscribeReminders(callback: TaskReminderCallback): () => void {
    this.reminderListeners.add(callback);
    return () => this.reminderListeners.delete(callback);
  }

  public registerTasksForMonitoring(tasks: AssistantTask[]) {
    const now = Date.now();
    tasks.forEach((task) => {
      if (task.completed) {
        this.monitoredTasks.delete(task.id);
        return;
      }

      const existing = this.monitoredTasks.get(task.id);
      if (existing) {
        existing.task = task;
        return;
      }

      const dueTimestamp = this.parseDeadlineToTimestamp(task.scheduledTime, task.createdAt);
      if (dueTimestamp && dueTimestamp > now - 10000) {
        this.monitoredTasks.set(task.id, {
          task,
          triggered: false,
          dueTimestamp,
        });
      }
    });
  }

  public triggerInstantTaskReminder(task: AssistantTask) {
    this.executeReminder(task);
  }

  private startReminderChecker() {
    if (this.reminderCheckInterval) return;

    this.reminderCheckInterval = setInterval(() => {
      const now = Date.now();
      this.monitoredTasks.forEach((item, taskId) => {
        if (!item.triggered && !item.task.completed && now >= item.dueTimestamp) {
          item.triggered = true;
          this.executeReminder(item.task);
        }
      });
    }, 2000);
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      this.hasRequestedNotificationPermission = true;
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  public executeReminder(task: AssistantTask) {
    triggerHaptic([60, 60, 100, 80, 120]);
    this.playChimeTone();

    // 1. Browser Notification
    const title = `Task Reminder: ${task.title}`;
    const body = task.details || `Your scheduled task "${task.title}" is due now.`;
    this.showBrowserNotification(title, { body });

    // 2. Spoken TTS Announcement
    const announcement = `Task reminder: ${task.title}. ${task.details || 'This task has reached its deadline.'}`;
    voiceEngine.speak(announcement, {
      interruptible: true,
      withEcho: false,
    });

    // 3. Notify app listeners (for visual toast / modal alert)
    this.reminderListeners.forEach((fn) => {
      try {
        fn(task, 'both');
      } catch (err) {
        console.error('Reminder listener callback error:', err);
      }
    });
  }

  public parseDeadlineToTimestamp(scheduledTime?: string, createdAt?: string): number | null {
    if (!scheduledTime) return null;
    const str = scheduledTime.trim().toLowerCase();
    const created = createdAt ? new Date(createdAt).getTime() : Date.now();

    // 1. Relative seconds: "in 10 seconds", "in 5s", "10 sec"
    const secMatch = str.match(/(?:in\s+)?(\d+)\s*(?:seconds?|secs?|s)\b/i);
    if (secMatch) {
      return Date.now() + parseInt(secMatch[1], 10) * 1000;
    }

    // 2. Relative minutes: "in 1 minute", "in 5 minutes", "in 30 mins", "5m"
    const minMatch = str.match(/(?:in\s+)?(\d+)\s*(?:minutes?|mins?|m)\b/i);
    if (minMatch) {
      return Date.now() + parseInt(minMatch[1], 10) * 60 * 1000;
    }

    // 3. Relative hours: "in 2 hours", "1h"
    const hrMatch = str.match(/(?:in\s+)?(\d+)\s*(?:hours?|hrs?|h)\b/i);
    if (hrMatch) {
      return Date.now() + parseInt(hrMatch[1], 10) * 3600 * 1000;
    }

    // 4. Time format: "10:30 am", "2:15 pm", "14:00"
    const timeMatch = str.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3];

      if (meridiem) {
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
      }

      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If time has passed today, target tomorrow
      if (target.getTime() < Date.now() - 60000) {
        target.setDate(target.getDate() + 1);
      }
      return target.getTime();
    }

    // 5. Direct ISO date parse
    const parsed = Date.parse(scheduledTime);
    if (!isNaN(parsed)) {
      return parsed;
    }

    // Default fallback: 10 minutes from now
    return created + 10 * 60 * 1000;
  }

  private showBrowserNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'task-reminder',
          ...options,
        } as NotificationOptions);
      } catch (err) {
        console.warn('Browser notification creation error:', err);
      }
    } else if (Notification.permission === 'default' && !this.hasRequestedNotificationPermission) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          try {
            new Notification(title, options);
          } catch {}
        }
      });
    }
  }

  public playChimeTone() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 3-note harmonic arpeggio (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.28, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.38);
      });
    } catch (e) {
      console.warn('Audio chime tone generation unavailable:', e);
    }
  }
}

export const androidAssistantService = new AndroidAssistantService();
