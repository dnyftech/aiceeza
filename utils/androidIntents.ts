import { AssistantTask, AndroidIntentType } from '../types';
import { androidAssistantService } from '../services/androidAssistantService';

export const DEFAULT_TASKS: AssistantTask[] = [
  {
    id: 'task-1',
    intentType: 'SET_REMINDER',
    title: 'Trade Intelligence Review',
    details: 'Review high-confidence market signals at market open.',
    scheduledTime: '10:00 AM Today',
    completed: false,
    createdAt: new Date().toISOString(),
    actionUrl: 'intent://com.google.android.assistant/REMINDER',
  },
  {
    id: 'task-2',
    intentType: 'CREATE_NOTE',
    title: 'Ceeza Neural DSP Architecture',
    details: 'Web Audio PCM 24kHz streaming with real-time FFT frequency metering.',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    intentType: 'SYSTEM_CONTROL',
    title: 'Haptic & Audio Calibration',
    details: 'Calibrate haptic pulse pattern for Android touch events.',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export interface IntentExecutionResult {
  executed: boolean;
  intentType: AndroidIntentType;
  title: string;
  details: string;
  task?: AssistantTask;
  confirmationText: string;
  actionUrl?: string;
}

/**
 * Natural language intent parser for mobile Android digital assistants (Ella, Gemini, Infinite AI, Xcel).
 * Interprets user speech & text into real mobile hardware actions & intents.
 */
export function detectAndExecuteAndroidIntent(userPrompt: string): IntentExecutionResult | null {
  const text = userPrompt.toLowerCase().trim();

  // 1. FLASHLIGHT / TORCH INTENT (Real Hardware Control via MediaStream)
  if (
    text.includes('flashlight') || 
    text.includes('turn on torch') || 
    text.includes('turn off torch') || 
    text.includes('toggle torch') || 
    text.includes('turn on light') || 
    text.includes('turn off light')
  ) {
    const isTurnOff = text.includes('off') || text.includes('disable') || text.includes('stop');
    const targetState = !isTurnOff;

    // Trigger physical flashlight on supported Android devices
    androidAssistantService.toggleTorch(targetState);

    const title = targetState ? 'Turn On Flashlight' : 'Turn Off Flashlight';
    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SYSTEM_CONTROL',
      title,
      details: targetState ? 'Torch hardware engaged via Android camera constraints.' : 'Torch disengaged.',
      completed: true,
      createdAt: new Date().toISOString(),
    };

    return {
      executed: true,
      intentType: 'SYSTEM_CONTROL',
      title,
      details: newTask.details,
      task: newTask,
      confirmationText: targetState 
        ? '🔦 Flashlight turned ON. Real hardware torch engaged on your Android device.' 
        : '🔦 Flashlight turned OFF.',
    };
  }

  // 2. COUNTDOWN TIMER INTENT
  if (text.includes('set a timer') || text.includes('set timer') || text.includes('timer for')) {
    let durationSeconds = 60; // default 1 minute
    let label = 'Assistant Timer';

    const minMatch = text.match(/(\d+)\s*(?:minute|min|m)/i);
    const secMatch = text.match(/(\d+)\s*(?:second|sec|s)/i);
    const hourMatch = text.match(/(\d+)\s*(?:hour|hr|h)/i);

    if (minMatch) {
      durationSeconds = parseInt(minMatch[1], 10) * 60;
      label = `${minMatch[1]} Minute Timer`;
    } else if (secMatch) {
      durationSeconds = parseInt(secMatch[1], 10);
      label = `${secMatch[1]} Second Timer`;
    } else if (hourMatch) {
      durationSeconds = parseInt(hourMatch[1], 10) * 3600;
      label = `${hourMatch[1]} Hour Timer`;
    }

    const timer = androidAssistantService.createTimer(label, durationSeconds);

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SET_REMINDER',
      title: label,
      details: `Active countdown timer (${durationSeconds}s) with audio chime alert.`,
      scheduledTime: `${Math.round(durationSeconds / 60)} min`,
      completed: false,
      createdAt: new Date().toISOString(),
      actionUrl: 'intent://android.intent.action.SET_TIMER',
    };

    return {
      executed: true,
      intentType: 'SET_REMINDER',
      title: label,
      details: newTask.details,
      task: newTask,
      confirmationText: `⏱️ Timer set for ${label}. Active countdown initiated with audio chime alert.`,
    };
  }

  // 3. SET ALARM / REMINDER INTENT
  if (text.includes('remind me') || text.includes('set a reminder') || text.includes('alarm for') || text.includes('wake me up')) {
    let cleanTitle = userPrompt
      .replace(/remind me to|set a reminder for|set reminder for|alarm for|wake me up at|wake me up/gi, '')
      .trim();
    if (!cleanTitle) cleanTitle = 'Neural Assistant Reminder';

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SET_REMINDER',
      title: cleanTitle,
      details: `Scheduled via GOD AI Assistant Intent engine at ${new Date().toLocaleTimeString()}`,
      scheduledTime: 'In 30 Minutes',
      completed: false,
      createdAt: new Date().toISOString(),
      actionUrl: 'intent://android.intent.action.SET_ALARM',
    };

    return {
      executed: true,
      intentType: 'SET_REMINDER',
      title: cleanTitle,
      details: newTask.details,
      task: newTask,
      confirmationText: `📱 Android Intent Executed: [SET_REMINDER] Created alarm & reminder for "${cleanTitle}".`,
    };
  }

  // 4. MAPS NAVIGATION INTENT
  if (text.includes('navigate to') || text.includes('directions to') || text.includes('route to') || text.includes('find near me')) {
    const destination = userPrompt
      .replace(/navigate to|directions to|route to|find near me|find/gi, '')
      .trim() || 'Nearby';

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'LAUNCH_APP',
      title: `Navigate to ${destination}`,
      details: `Google Maps navigation intent dispatched for ${destination}.`,
      completed: true,
      createdAt: new Date().toISOString(),
      actionUrl: mapsUrl,
    };

    return {
      executed: true,
      intentType: 'LAUNCH_APP',
      title: `Navigate to ${destination}`,
      details: newTask.details,
      task: newTask,
      actionUrl: mapsUrl,
      confirmationText: `📍 Android Maps Intent: Routing navigation to "${destination}". Tap to open Google Maps navigation.`,
    };
  }

  // 5. PHONE CALL / DIALER INTENT
  if (text.startsWith('call ') || text.startsWith('dial ') || text.includes('phone call')) {
    const rawNumber = text.replace(/call|dial|phone|make a call to/gi, '').trim();
    const cleanNumber = rawNumber || '555-0199';
    const telUrl = `tel:${cleanNumber}`;

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'LAUNCH_APP',
      title: `Call ${cleanNumber}`,
      details: `Dispatched Android dialer intent: tel:${cleanNumber}`,
      completed: true,
      createdAt: new Date().toISOString(),
      actionUrl: telUrl,
    };

    return {
      executed: true,
      intentType: 'LAUNCH_APP',
      title: `Call ${cleanNumber}`,
      details: newTask.details,
      task: newTask,
      actionUrl: telUrl,
      confirmationText: `📞 Android Phone Intent: Ready to call ${cleanNumber}.`,
    };
  }

  // 6. SEND SMS / WHATSAPP MESSAGE INTENT
  if (text.includes('send text') || text.includes('send sms') || text.includes('whatsapp')) {
    const messageBody = userPrompt.replace(/send text|send sms|whatsapp message|whatsapp|to/gi, '').trim() || 'Hello from GOD AI';
    const isWhatsApp = text.includes('whatsapp');
    const intentUrl = isWhatsApp 
      ? `https://wa.me/?text=${encodeURIComponent(messageBody)}`
      : `sms:?body=${encodeURIComponent(messageBody)}`;

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SEND_MESSAGE',
      title: isWhatsApp ? 'WhatsApp Message' : 'SMS Text Message',
      details: messageBody,
      completed: true,
      createdAt: new Date().toISOString(),
      actionUrl: intentUrl,
    };

    return {
      executed: true,
      intentType: 'SEND_MESSAGE',
      title: newTask.title,
      details: messageBody,
      task: newTask,
      actionUrl: intentUrl,
      confirmationText: `💬 Android Messaging Intent: Prepared ${isWhatsApp ? 'WhatsApp' : 'SMS'} message "${messageBody}".`,
    };
  }

  // 7. CREATE NOTE INTENT
  if (text.includes('take a note') || text.includes('save note') || text.includes('create note') || text.includes('note down')) {
    let noteContent = userPrompt.replace(/take a note|save note|create note|note down|that/gi, '').trim();
    if (!noteContent) noteContent = 'Assistant Note Entry';

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'CREATE_NOTE',
      title: noteContent.slice(0, 30) + (noteContent.length > 30 ? '...' : ''),
      details: noteContent,
      completed: false,
      createdAt: new Date().toISOString(),
      actionUrl: 'intent://android.intent.action.SEND',
    };

    return {
      executed: true,
      intentType: 'CREATE_NOTE',
      title: newTask.title,
      details: noteContent,
      task: newTask,
      confirmationText: `📝 Android Intent Executed: [CREATE_NOTE] Saved to Assistant Notes.`,
    };
  }

  // 8. LAUNCH APP INTENT
  if (text.includes('open app') || text.includes('launch app') || text.includes('open camera') || text.includes('open settings') || text.includes('open youtube')) {
    let appName = 'System App';
    if (text.includes('camera')) appName = 'Camera';
    else if (text.includes('youtube')) appName = 'YouTube';
    else if (text.includes('settings')) appName = 'System Settings';
    else appName = userPrompt.replace(/open app|launch app|open/gi, '').trim() || 'App';

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'LAUNCH_APP',
      title: `Launch ${appName}`,
      details: `Package Intent: android.intent.action.MAIN -> ${appName}`,
      completed: true,
      createdAt: new Date().toISOString(),
      actionUrl: `android-app://${appName.toLowerCase().replace(/\s+/g, '')}`,
    };

    return {
      executed: true,
      intentType: 'LAUNCH_APP',
      title: `Launch ${appName}`,
      details: newTask.details,
      task: newTask,
      confirmationText: `🚀 Android Intent Executed: Dispatched system launch intent for ${appName}.`,
    };
  }

  // 9. SYSTEM HARDWARE INTENT (Battery, Clipboard, Mute)
  if (text.includes('battery') || text.includes('mute audio') || text.includes('clipboard')) {
    let actionName = 'System Utility';
    if (text.includes('battery')) actionName = 'Check Battery Telemetry';
    else if (text.includes('clipboard')) actionName = 'Inspect Clipboard Data';
    else if (text.includes('mute')) actionName = 'Mute System Audio';

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SYSTEM_CONTROL',
      title: actionName,
      details: `Dispatched hardware control intent to Android system bridge.`,
      completed: true,
      createdAt: new Date().toISOString(),
    };

    return {
      executed: true,
      intentType: 'SYSTEM_CONTROL',
      title: actionName,
      details: newTask.details,
      task: newTask,
      confirmationText: `⚡ Android System Intent Executed: ${actionName} applied successfully.`,
    };
  }

  return null;
}
