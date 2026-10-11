export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export enum ModelMode {
  Pro = 'gemini-3.8-flash', // High intelligence standard model
  Fast = 'gemini-3.1-flash-lite', // Low latency
  Thinking = 'thinking-mode', // Deep reasoning mode with thinking budget
}

export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
}

export interface GroundingMetadata {
  searchQueries?: string[];
  sources?: GroundingSource[];
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
  groundingMetadata?: GroundingMetadata; // Search Grounding citations and queries
  reactions?: Record<string, number>; // Map of emoji to reaction count
  userReactions?: string[]; // Emojis added by the current user
  isSaved?: boolean; // Whether message is bookmarked / flagged for review
  savedAt?: string; // ISO timestamp of bookmark
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

// --- Artifacts System Types ---
export type ArtifactType = 'code' | 'markdown' | 'svg' | 'table' | 'interactive';

export interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  language?: string;
  content: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  version: number;
  tags?: string[];
}

// --- Workspace Suite Types ---
export interface Workspace {
  id: string;
  name: string;
  icon: string;
  description: string;
  scratchpad: string;
  createdAt: string;
  activeEngine: string;
  tags: string[];
}

// --- Internal Engine & Telemetry Types ---
export type EngineModuleId = 
  | 'cortex_neural'
  | 'kokoro_voice_engine'
  | 'search_grounding'
  | 'audio_vocal_dsp'
  | 'multimodal_vision'
  | 'code_sandbox'
  | 'android_intent';

export interface EngineModuleInfo {
  id: EngineModuleId;
  name: string;
  badge: string;
  status: 'active' | 'standby' | 'optimizing';
  latencyMs: number;
  description: string;
  capabilities: string[];
}

export interface EngineConfig {
  temperature: number;
  thinkingBudget: number; // In tokens (1024 to 32768)
  topP: number;
  searchGrounding: boolean;
  audioSampleRate: number; // 16000 or 24000
  echoCancelation: boolean;
  hardwareAcceleration: boolean;
}

export interface EngineTelemetry {
  totalTokens: number;
  totalRequests: number;
  avgLatencyMs: number;
  lastLatencyMs: number;
  cacheHitCount: number;
  liveConnectionsCount: number;
}

// --- Cross-Device API Module Types ---
export interface DeviceCapabilities {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  touchPoints: number;
  isTouch: boolean;
  isOnline: boolean;
  connectionType: string;
  downlinkSpeed?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
  webAudioSupported: boolean;
  webSpeechSupported: boolean;
  pwaStandalone: boolean;
  platform: string;
}
