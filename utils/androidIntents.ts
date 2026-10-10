import { AssistantTask, AndroidIntentType } from '../types';

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
}

/**
 * Natural language intent parser for Android Assistant Model actions.
 */
export function detectAndExecuteAndroidIntent(userPrompt: string): IntentExecutionResult | null {
  const text = userPrompt.toLowerCase().trim();

  // 1. SET REMINDER INTENT
  if (text.includes('remind me') || text.includes('set a reminder') || text.includes('alarm for')) {
    let cleanTitle = userPrompt.replace(/remind me to|set a reminder for|set reminder for|alarm for/gi, '').trim();
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
      confirmationText: `📱 Android Intent Executed: [SET_REMINDER] Created reminder for "${cleanTitle}".`,
    };
  }

  // 2. CREATE NOTE INTENT
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
      confirmationText: `📝 Android Intent Executed: [CREATE_NOTE] Saved to Ceeza Assistant Notes.`,
    };
  }

  // 3. LAUNCH APP INTENT
  if (text.includes('open app') || text.includes('launch app') || text.includes('open camera') || text.includes('open maps') || text.includes('open settings')) {
    let appName = 'System App';
    if (text.includes('camera')) appName = 'Camera';
    else if (text.includes('maps')) appName = 'Google Maps';
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

  // 4. SYSTEM CONTROL INTENT
  if (text.includes('flashlight') || text.includes('mute audio') || text.includes('battery status') || text.includes('toggle dark mode')) {
    let actionName = 'System Utility';
    if (text.includes('flashlight')) actionName = 'Torch Flashlight Toggle';
    else if (text.includes('mute')) actionName = 'Mute System Audio';
    else if (text.includes('battery')) actionName = 'Check Battery Status (98% Health)';
    else actionName = 'System Control Dispatch';

    const newTask: AssistantTask = {
      id: `task-${Date.now()}`,
      intentType: 'SYSTEM_CONTROL',
      title: actionName,
      details: `Dispatched hardware control intent to Android HAL.`,
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
