import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { ModelMode, VoicePersonalityId, VoicePersonality, GroundingMetadata, GroundingSource } from "../types";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "./audio";

// Initialize the SDK
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const VOICE_PERSONALITIES: Record<VoicePersonalityId, VoicePersonality> = {
  ceeza: {
    id: 'ceeza',
    name: 'Caesar (Trade Intel)',
    badge: 'Street Smart',
    description: 'High-confidence, trade-grounded street smarts with punchy, cinematic authority.',
    systemInstruction: `You are GOD AI, also known as Caesar. You are the 99% Feature Intelligence. Your voice and personality embodiment is street-grounded, high confidence, trade style intelligence. Speak naturally without excessive complex symbols. Keep responses concise, punchy, and cinematic.`,
    voiceName: 'Zephyr',
    ttsPromptPrefix: 'Read this out loud naturally and expressively in a clear, confident, street-smart tone. Use natural human pauses [pause], vocal warmth, authentic emotional inflection [confident], and articulate pacing. Emphasize key ideas naturally:',
    pitchLabel: 'Low & Heavy (Grounding)',
  },
  engineer: {
    id: 'engineer',
    name: 'Concise Engineer',
    badge: 'System Core',
    description: 'Ultra-precise, technical, zero fluff or filler, focused on structural clarity.',
    systemInstruction: `You are GOD AI in Concise Engineer Mode. Provide ultra-precise, modular, technical, and architecturally clear responses. Eliminate introductory filler, conversational fluff, and unnecessary preambles. Prioritize direct answers, technical accuracy, and code clarity.`,
    voiceName: 'Fenrir',
    ttsPromptPrefix: 'Read this out loud in a measured, calm, crystal-clear technical delivery with deliberate punctuation pauses [pause], confident articulation, and focused engineering authority:',
    pitchLabel: 'Direct & Measured (Neutral Pitch)',
  },
  guide: {
    id: 'guide',
    name: 'Casual Guide',
    badge: 'Mentor',
    description: 'Warm, friendly, step-by-step conversational mentor using simple analogies.',
    systemInstruction: `You are GOD AI in Casual Guide Mode. Speak warmly, encouragingly, and accessibly. Use simple analogies, friendly conversational phrasing, and clear step-by-step guidance to make complex topics effortless to understand.`,
    voiceName: 'Puck',
    ttsPromptPrefix: 'Read this out loud with a warm, friendly, uplifting smile in your voice [warm], gentle natural pauses [pause], compassionate clarity, and upbeat conversational reassurance:',
    pitchLabel: 'Upbeat & Warm (+1.5 semitones)',
  },
  muse: {
    id: 'muse',
    name: 'Creative Muse',
    badge: 'Visionary',
    description: 'Imaginative, poetic, inspiring, rich in artistic depth and visionary flair.',
    systemInstruction: `You are GOD AI in Creative Muse Mode. Respond with visionary flair, artistic metaphors, poetic rhythm, and creative depth. Inspire out-of-the-box thinking and fresh conceptual ideas.`,
    voiceName: 'Aoede',
    ttsPromptPrefix: 'Read this out loud with rich poetic soul, deep emotional cadence, dramatic natural pauses [dramatic pause], and inspiring visionary resonance [thoughtful]:',
    pitchLabel: 'Melodic & Expressive (Dynamic Pitch)',
  },
};

// --- Text/Multimodal Chat Generation with Search Grounding ---

function extractDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

interface SendMessageOptions {
  message: string;
  mode: ModelMode;
  image?: { data: string; mimeType: string };
  personalityId?: VoicePersonalityId;
  enableSearchGrounding?: boolean;
}

export const sendMessageToGemini = async ({
  message,
  mode,
  image,
  personalityId = 'ceeza',
  enableSearchGrounding = true
}: SendMessageOptions) => {
  try {
    const personality = VOICE_PERSONALITIES[personalityId] || VOICE_PERSONALITIES.ceeza;
    let modelName: string = 'gemini-3.8-flash';
    let config: any = {
      systemInstruction: personality.systemInstruction
    };
    const parts: any[] = [];

    // Feature-specific Model Selection logic
    if (mode === ModelMode.Thinking) {
      modelName = 'gemini-3.8-flash';
      config.thinkingConfig = { thinkingBudget: 32768 };
      // Explicitly do NOT set maxOutputTokens per instructions
    } else if (mode === ModelMode.Fast) {
      modelName = 'gemini-3.1-flash-lite';
    } else {
      modelName = 'gemini-3.8-flash';
    }

    // Search Grounding configuration
    if (enableSearchGrounding) {
      // Google Search Grounding tool
      config.tools = [{ googleSearch: {} }];
      // Use gemini-3.8-flash for search grounding
      if (modelName === 'gemini-3.1-flash-lite') {
        modelName = 'gemini-3.8-flash';
      }
    }

    // Construct Content
    if (image) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    parts.push({ text: message });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config,
    });

    // Extract Google Search Grounding Metadata
    const candidate = response.candidates?.[0];
    const rawGrounding = candidate?.groundingMetadata;

    let groundingMetadata: GroundingMetadata | undefined = undefined;

    if (rawGrounding) {
      const searchQueries: string[] = rawGrounding.webSearchQueries || [];
      const rawChunks: any[] = rawGrounding.groundingChunks || [];
      const sources: GroundingSource[] = [];

      for (const chunk of rawChunks) {
        if (chunk?.web?.uri) {
          const uri: string = chunk.web.uri;
          const domain = extractDomain(uri);
          const title: string = chunk.web.title || domain;
          sources.push({
            title,
            url: uri,
            domain,
          });
        }
      }

      // Deduplicate sources by URL
      const uniqueSources = sources.filter((item, index, self) =>
        index === self.findIndex((t) => t.url === item.url)
      );

      if (searchQueries.length > 0 || uniqueSources.length > 0) {
        groundingMetadata = {
          searchQueries,
          sources: uniqueSources,
        };
      }
    }

    return {
      text: response.text,
      groundingMetadata,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- Audio Transcription (STT) ---

export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          { text: "Transcribe this audio strictly verbatim." },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};

export const AVAILABLE_VOICES = [
  { id: 'Zephyr', name: 'Zephyr', variant: 'Cinematic Trade', style: 'High confidence & natural warmth' },
  { id: 'Fenrir', name: 'Fenrir', variant: 'Technical Engine', style: 'Measured, precise & direct' },
  { id: 'Puck', name: 'Puck', variant: 'Upbeat Mentor', style: 'Warm, positive & friendly' },
  { id: 'Aoede', name: 'Aoede', variant: 'Expressive Muse', style: 'Melodic & inspiring' },
  { id: 'Kore', name: 'Kore', variant: 'Soft Clear', style: 'Smooth, serene & articulate' },
  { id: 'Charon', name: 'Charon', variant: 'Deep Resonance', style: 'Low-pitch authoritative bass' },
  { id: 'Orus', name: 'Orus', variant: 'Bold Command', style: 'Dynamic, punchy & high impact' },
];

/**
 * Formats raw markdown/chat text into natural speech with emotional cues,
 * expressive tags, and natural human pauses for conversational TTS playback.
 */
export function formatTextForExpressiveSpeech(rawText: string): string {
  // 1. Remove code blocks entirely (or summarize them) so TTS doesn't read brackets/semicolons
  let spoken = rawText.replace(/```[\s\S]*?```/g, ' [pause] Code snippet omitted for spoken review. [pause] ');
  
  // 2. Remove inline code backticks, bold/italic symbols, URLs
  spoken = spoken.replace(/`([^`]+)`/g, '$1');
  spoken = spoken.replace(/https?:\/\/\S+/g, 'link');
  spoken = spoken.replace(/[*_~#]/g, '');

  // 3. Convert markdown headers and bullet points into natural spoken pacing with pauses
  spoken = spoken.replace(/^#+\s*(.+)$/gm, ' [thoughtful] $1. [pause] ');
  spoken = spoken.replace(/^\s*[-*•]\s*(.+)$/gm, ' [pause] Next: $1. ');
  spoken = spoken.replace(/^\s*\d+\.\s*(.+)$/gm, ' [pause] Step: $1. ');

  // 4. Introduce natural conversational pauses after periods, exclamation marks, questions
  spoken = spoken.replace(/\.\s+/g, '. [pause] ');
  spoken = spoken.replace(/!\s+/g, '! [enthusiastic] [pause] ');
  spoken = spoken.replace(/\?\s+/g, '? [curious] [pause] ');
  spoken = spoken.replace(/:\s+/g, ': [pause] ');
  spoken = spoken.replace(/;\s+/g, '; [short pause] ');

  // 5. Clean up any redundant whitespace or double pauses
  spoken = spoken.replace(/\[pause\]\s*\[pause\]/g, '[pause]');
  spoken = spoken.replace(/\s{2,}/g, ' ').trim();

  return spoken;
}

// --- Text to Speech (TTS) ---

export const generateSpeech = async (
  text: string, 
  personalityId: VoicePersonalityId = 'ceeza',
  customVoiceName?: string
): Promise<ArrayBuffer | null> => {
  try {
    const personality = VOICE_PERSONALITIES[personalityId] || VOICE_PERSONALITIES.ceeza;
    const selectedVoice = customVoiceName || personality.voiceName || 'Zephyr';
    
    // Prepare formatted speech with natural pauses and emotional tags
    const speechFormattedText = formatTextForExpressiveSpeech(text);
    const prompt = `${personality.ttsPromptPrefix} "${speechFormattedText}"`;
    
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });
    } catch (primaryErr) {
      console.warn("gemini-3.8-flash-lite-tts error, attempting fallback with gemini-3.8-flash-tts:", primaryErr);
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });
    }

    const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
    return null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};


// --- Live API Connection ---

export const connectLiveSession = async (
  outputAudioContext: AudioContext,
  onAudioData: (buffer: AudioBuffer) => void,
  onTranscription: (text: string, isInterim: boolean, sender: 'user' | 'bot') => void,
  onClose: () => void,
  onAnalyserCreated?: (analyser: AnalyserNode) => void,
  personalityId: VoicePersonalityId = 'ceeza',
  customVoiceName?: string
) => {
  const personality = VOICE_PERSONALITIES[personalityId] || VOICE_PERSONALITIES.ceeza;
  const activeVoice = customVoiceName || personality.voiceName;
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  
  let stream: MediaStream;
  try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
      console.error("Mic access denied", e);
      return null;
  }

  // Create real-time Audio Analyser
  const analyser = inputAudioContext.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.75;
  if (onAnalyserCreated) {
    onAnalyserCreated(analyser);
  }

  const sessionPromise = ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    callbacks: {
      onopen: () => {
        console.log("Live session opened");
        const source = inputAudioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createPcmBlob(inputData);
          
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        // Handle Audio
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioBuffer = await decodeAudioData(
            base64ToUint8Array(base64Audio),
            outputAudioContext,
            24000,
            1
          );
          onAudioData(audioBuffer);
        }

        // Handle Transcriptions
        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
           onTranscription(message.serverContent.modelTurn.parts[0].text, false, 'bot');
        }
        
        // Handle User Transcriptions (Interim and Final)
        const userTranscription = (message.serverContent as any)?.userContent?.parts?.[0]?.text;
        if (userTranscription) {
           onTranscription(userTranscription, false, 'user');
        }
      },
      onclose: () => {
        console.log("Live session closed");
        onClose();
        stream.getTracks().forEach(track => track.stop());
        inputAudioContext.close();
      },
      onerror: (err) => {
        console.error("Live session error", err);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: activeVoice } },
      },
      systemInstruction: personality.systemInstruction,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });

  return {
      sessionPromise,
      close: () => {
          try {
            stream.getTracks().forEach(track => track.stop());
          } catch (e) {}
          if (inputAudioContext.state !== 'closed') {
            try { inputAudioContext.close(); } catch (e) {}
          }
          sessionPromise.then(s => s.close()).catch(() => {});
      }
  };
};