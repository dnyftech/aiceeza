export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export enum ModelMode {
  Pro = 'gemini-3.6-flash', // High intelligence
  Fast = 'gemini-3.1-flash-lite', // Low latency
  Thinking = 'thinking-mode', // Deep reasoning mode with thinking budget
}

export type VoicePersonalityId = 'ceeza' | 'engineer' | 'guide' | 'muse';

export type OrbTheme = 'classic' | 'emerald' | 'nebula' | 'cyberpunk';

export interface VoicePersonality {
  id: VoicePersonalityId;
  name: string;
  badge: string;
  description: string;
  systemInstruction: string;
  voiceName: string; // prebuiltVoiceConfig default voiceName
  ttsPromptPrefix: string;
  pitchLabel: string;
}

export interface Attachment {
  type: 'image' | 'audio';
  data: string; // Base64
  mimeType: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  attachments?: Attachment[];
  isThinking?: boolean; // If true, show thinking indicator & reasoning chain
  reasoningSteps?: string[]; // Step-by-step logic breakdown for Thinking mode
  feedback?: 'up' | 'down';
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: '99% Intelligence Tier' | 'Pro Master' | 'System Architect' | 'Guest User';
  theme: OrbTheme;
  queriesCount: number;
  voiceSessionsCount: number;
  createdAt: string;
}

export type AndroidIntentType = 
  | 'SET_REMINDER'
  | 'CREATE_NOTE'
  | 'LAUNCH_APP'
  | 'SEND_MESSAGE'
  | 'SYSTEM_CONTROL'
  | 'SCHEDULE_TASK';

export interface AssistantTask {
  id: string;
  intentType: AndroidIntentType;
  title: string;
  details: string;
  scheduledTime?: string;
  completed: boolean;
  createdAt: string;
  actionUrl?: string;
}
