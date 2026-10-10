import { Artifact } from '../types';

export const DEFAULT_ARTIFACTS: Artifact[] = [
  {
    id: 'art-telemetry-dashboard',
    title: 'Cross-Device Neural Engine Dashboard',
    type: 'code',
    language: 'html',
    description: 'Interactive HTML/JS canvas measuring latency, tokens, GPU frame rates, and live neural node telemetry.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: 'ws-default',
    version: 1,
    tags: ['React', 'Telemetry', 'Dashboard'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neural Cortex Telemetry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 12px;
    }
    .title { font-size: 18px; font-weight: 700; color: #FAAD3F; }
    .badge {
      background: rgba(250, 173, 63, 0.15);
      color: #FAAD3F;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      border: 1px solid rgba(250, 173, 63, 0.3);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 16px;
    }
    .card-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
    .card-val { font-size: 24px; font-weight: 700; color: #fff; }
    .canvas-container {
      background: #040711;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 12px;
    }
    canvas { width: 100%; height: 160px; display: block; border-radius: 8px; }
    button {
      background: #FAAD3F;
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">GOD AI Neural Core Telemetry</div>
    <div class="badge">99% Intelligence Tier</div>
  </div>
  <div class="grid">
    <div class="card">
      <div class="card-label">Active Engine</div>
      <div class="card-val" style="color: #38bdf8;">Gemini 3.8</div>
    </div>
    <div class="card">
      <div class="card-label">Inference Latency</div>
      <div class="card-val" id="lat-val">142 ms</div>
    </div>
    <div class="card">
      <div class="card-label">Thinking Cortex</div>
      <div class="card-val" style="color: #a855f7;">Active</div>
    </div>
    <div class="card">
      <div class="card-label">Hardware FPS</div>
      <div class="card-val" id="fps-val">60 fps</div>
    </div>
  </div>
  <div class="canvas-container">
    <div class="card-label" style="margin-bottom: 8px;">Real-Time Neural Synapse Waveform</div>
    <canvas id="synapseCanvas"></canvas>
  </div>
  <button onclick="pingEngine()">Trigger Neural Ping</button>

  <script>
    const canvas = document.getElementById('synapseCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = 320;

    let step = 0;
    function draw() {
      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FAAD3F';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin((x + step) * 0.03) * 40 * Math.sin(step * 0.02) + Math.cos(x * 0.01) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second harmonic wave
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin((x - step * 1.5) * 0.02) * 50;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step += 2;
      requestAnimationFrame(draw);
    }
    draw();

    function pingEngine() {
      const lat = Math.floor(110 + Math.random() * 60);
      document.getElementById('lat-val').innerText = lat + ' ms';
    }
  </script>
</body>
</html>`
  },
  {
    id: 'art-cortex-architecture',
    title: 'Cross-Device Multi-Engine Architecture RFC',
    type: 'markdown',
    language: 'markdown',
    description: 'System specifications for bidirectional Live Voice, Thinking Cortex, and Cross-Platform Storage.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: 'ws-default',
    version: 1,
    tags: ['Architecture', 'Cortex', 'RFC'],
    content: `# GOD AI Cross-Device Multi-Engine Architecture

## 1. Executive Summary
GOD AI deploys a unified multi-engine pipeline coordinating:
- **Cortex Neural Engine**: Gemini 3.8 Flash for zero-latency synthesis and Deep Thinking Cortex.
- **Search Grounding Engine**: Real-time Google Search grounding with URL domain verification.
- **Vocal DSP Engine**: Bidirectional WebSocket WebAudio pipeline operating at 24kHz PCM / RIFF.
- **Artifacts Engine**: Live client-side sandbox execution with responsive viewport emulation.

\`\`\`
[User Query / Multimodal Input]
           │
           ▼
[Device Detection & API Module] ──► (Mobile / Tablet / Desktop)
           │
           ▼
[Multi-Engine Orchestrator]
 ├── Thinking Cortex (32k token budget)
 ├── Search Grounding (Live Web verification)
 └── Vocal DSP (24kHz Echo Cancellation)
           │
           ▼
[Artifacts & Workspace Sandbox]
\`\`\`

## 2. Cross-Device Performance Constraints
| Viewport Class | Target Latency | Memory Ceiling | Audio Pipeline |
| :--- | :--- | :--- | :--- |
| **Mobile (Android/iOS)** | < 250ms | 256 MB | 16kHz PCM |
| **Tablet (Foldable/iPad)**| < 200ms | 512 MB | 24kHz PCM |
| **Desktop / Workstation**| < 150ms | 1024 MB | 24kHz Echo-Cancelled |

## 3. Storage & Workspace Replication
Workspaces, Artifacts, and Assistant Intents replicate to client-authoritative LocalStorage and exportable JSON bundles.
`
  },
  {
    id: 'art-svg-state-machine',
    title: 'Neural Lifecycle State Machine (Interactive SVG)',
    type: 'svg',
    language: 'xml',
    description: 'Vector state machine diagram detailing transitions across Idle, Thinking, Grounding, and Audio streaming.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: 'ws-default',
    version: 1,
    tags: ['SVG', 'Diagram', 'State Machine'],
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F38020"/>
      <stop offset="100%" stop-color="#FAAD3F"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="800" height="400" fill="url(#bgGrad)" rx="16" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

  <!-- Connections -->
  <path d="M 180 200 L 320 120" stroke="#FAAD3F" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7"/>
  <path d="M 180 200 L 320 280" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.7"/>
  <path d="M 480 120 L 620 200" stroke="#a855f7" stroke-width="2.5" opacity="0.7"/>
  <path d="M 480 280 L 620 200" stroke="#34d399" stroke-width="2.5" opacity="0.7"/>

  <!-- Idle Node -->
  <g transform="translate(100, 160)">
    <circle cx="40" cy="40" r="45" fill="#131b2e" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <circle cx="40" cy="40" r="8" fill="#FAAD3F" filter="url(#glow)"/>
    <text x="40" y="45" text-anchor="middle" fill="#fff" font-family="monospace" font-size="12" font-weight="bold">IDLE</text>
  </g>

  <!-- Thinking Cortex Node -->
  <g transform="translate(320, 80)">
    <rect width="160" height="80" rx="12" fill="#1c1938" stroke="#a855f7" stroke-width="2"/>
    <text x="80" y="38" text-anchor="middle" fill="#c084fc" font-family="monospace" font-size="12" font-weight="bold">THINKING CORTEX</text>
    <text x="80" y="58" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">Multi-Step Budget</text>
  </g>

  <!-- Grounding Node -->
  <g transform="translate(320, 240)">
    <rect width="160" height="80" rx="12" fill="#0c2538" stroke="#38bdf8" stroke-width="2"/>
    <text x="80" y="38" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">WEB GROUNDING</text>
    <text x="80" y="58" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">Verified Web Index</text>
  </g>

  <!-- Synthesizer Output Node -->
  <g transform="translate(620, 160)">
    <circle cx="40" cy="40" r="48" fill="url(#orangeGrad)" stroke="#fff" stroke-width="2"/>
    <text x="40" y="44" text-anchor="middle" fill="#000" font-family="monospace" font-size="12" font-weight="bold">SYNTHESIS</text>
  </g>

  <text x="400" y="370" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="11">
    GOD AI Engine Orchestration Pipeline · Cross-Device Vector Spec
  </text>
</svg>`
  }
];

export const DEFAULT_WORKSPACES = [
  {
    id: 'ws-default',
    name: 'Primary Command',
    icon: '⚡',
    description: 'Central orchestrator for AI chat, live vocal streaming, and quick tasks.',
    scratchpad: `# Primary Command Scratchpad\n\n- Active engine: Gemini 3.8 Flash Neural Cortex\n- Multi-modal capabilities verified.\n- Search Grounding enabled with live citations.`,
    createdAt: new Date().toISOString(),
    activeEngine: 'Gemini 3.8 Flash',
    tags: ['Core', 'General', 'Live']
  },
  {
    id: 'ws-engineering',
    name: 'Engineering & Code Labs',
    icon: '🛠️',
    description: 'High-speed code synthesis, React components, and algorithmic sandboxes.',
    scratchpad: `# Engineering & Systems Laboratory\n\n### Current Project\n- Sandboxed Artifacts Engine with responsive viewport preview.\n- WebSocket audio pipeline with RIFF WAV decoding.`,
    createdAt: new Date().toISOString(),
    activeEngine: 'Gemini 3.8 Flash-Lite',
    tags: ['Code', 'Architecture', 'TypeScript']
  },
  {
    id: 'ws-cortex',
    name: 'Deep Cortex Research',
    icon: '🧠',
    description: 'Multi-step algorithmic proofs, architectural trade-offs, and mathematical deductions.',
    scratchpad: `# Deep Cortex Thinking Budget\n\n- Time & space complexity evaluations.\n- Distributed consensus matrix analysis.`,
    createdAt: new Date().toISOString(),
    activeEngine: 'Thinking Cortex',
    tags: ['Reasoning', 'Thinking', 'Analysis']
  }
];

export function extractArtifactFromText(text: string): { title: string; language: string; content: string } | null {
  // Regex to look for markdown code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (match && match[2] && match[2].trim().length > 30) {
    const rawLang = (match[1] || 'html').toLowerCase();
    let language = rawLang;
    if (['jsx', 'tsx', 'ts', 'js', 'javascript', 'typescript'].includes(rawLang)) {
      language = 'typescript';
    } else if (['html', 'htm'].includes(rawLang)) {
      language = 'html';
    } else if (['py', 'python'].includes(rawLang)) {
      language = 'python';
    } else if (['json'].includes(rawLang)) {
      language = 'json';
    } else if (['svg'].includes(rawLang)) {
      language = 'svg';
    }

    // Try to extract a title from the preceding line or first line of comment
    let title = 'Extracted Code Artifact';
    const lines = text.slice(0, match.index).trim().split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine && lastLine.length < 80 && !lastLine.startsWith('```')) {
      title = lastLine.replace(/[#*`_]/g, '').trim();
    }

    return {
      title: title || 'Extracted Code Artifact',
      language,
      content: match[2].trim()
    };
  }

  return null;
}
