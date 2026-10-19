import { ArtifactType } from '../types';

export interface PromptUITemplate {
  id: string;
  category: 'all' | 'engineering' | 'architecture' | 'audio' | 'reasoning' | 'mobile';
  title: string;
  subtitle: string;
  prompt: string;
  categoryLabel: string;
  engineMode: 'Standard' | 'Deep Thinking' | 'Search Grounded' | 'Audio DSP';
  badgeColor?: string;
  requiresGrounding?: boolean;
  requiresThinking?: boolean;
}

export interface ArtifactUITemplate {
  id: string;
  title: string;
  category: 'dashboard' | 'dsp' | 'mobile' | 'diagram' | 'spec';
  categoryLabel: string;
  type: ArtifactType;
  language: string;
  description: string;
  tags: string[];
  content: string;
}

export const PROMPT_UI_TEMPLATES: PromptUITemplate[] = [
  {
    id: 'search_grounding',
    category: 'all',
    title: 'Real-Time Search Grounding',
    subtitle: 'Fetch live real-world news, verified web citations, and fresh market & technology developments.',
    prompt: 'What are the most significant developments in AI, technology, and engineering happening this week? Ground your answer with verified live web sources and citations.',
    categoryLabel: 'Web Intelligence',
    engineMode: 'Search Grounded',
    requiresGrounding: true
  },
  {
    id: 'code_websocket_dsp',
    category: 'engineering',
    title: 'WebSocket Audio DSP Hook',
    subtitle: 'Build a production-grade React TypeScript hook with 24kHz WebAudio sampling, backoff, and TypedArray buffers.',
    prompt: 'Write a high-performance React TypeScript custom hook for handling real-time WebSocket audio DSP with reconnection backoff, TypedArray audio buffers, and strict error handling.',
    categoryLabel: 'Engineering',
    engineMode: 'Standard'
  },
  {
    id: 'deep_consensus_reasoning',
    category: 'reasoning',
    title: 'Deep Consensus & Partition Proofs',
    subtitle: 'Apply multi-step reasoning to evaluate Raft vs. Paxos consensus algorithms under high network partitioning.',
    prompt: 'Apply deep multi-step thinking to analyze time and space complexity tradeoffs between Raft and Paxos consensus algorithms under high network partitioning and Byzantine failure states.',
    categoryLabel: 'Deep Cortex',
    engineMode: 'Deep Thinking',
    requiresThinking: true
  },
  {
    id: 'system_architecture_rfc',
    category: 'architecture',
    title: 'Microservices Architecture RFC',
    subtitle: 'Draft a full-scale systems architecture specification with cross-device latency budgets and fault isolation.',
    prompt: 'Draft an engineering RFC specification for an edge-orchestrated microservices platform supporting low-latency multimodal voice streaming, SQLite caching, and global Redis state sync.',
    categoryLabel: 'Architecture',
    engineMode: 'Deep Thinking',
    requiresThinking: true
  },
  {
    id: 'audio_dsp_pipeline',
    category: 'audio',
    title: 'Ceeza Neural Voice DSP Pipeline',
    subtitle: 'Explore 24kHz Web Audio synthesis, dual gain echo cancellation, and real-time spectrum analysis.',
    prompt: 'Explain how to architect a bidirectional 24kHz PCM audio pipeline in modern browsers with Web Audio API, echo cancellation, gain staging, and live visualizer waveforms.',
    categoryLabel: 'Neural Audio',
    engineMode: 'Audio DSP'
  },
  {
    id: 'mobile_android_intents',
    category: 'mobile',
    title: 'Android OS Intents & Native Tasks',
    subtitle: 'Orchestrate native mobile capabilities: alarms, local reminders, device torches, and background workers.',
    prompt: 'Show how to build an Android digital assistant intent dispatcher in TypeScript that translates natural user instructions into hardware flashlight triggers, countdown timers, and system notifications.',
    categoryLabel: 'Mobile Intents',
    engineMode: 'Standard'
  },
  {
    id: 'ceeza_high_leverage',
    category: 'all',
    title: 'Ceeza Monetization & Product Velocity',
    subtitle: 'Get high-confidence, street-smart execution tactics for shipping resilient, high-margin software.',
    prompt: 'Yo Ceeza! Give me a high-confidence, street-smart breakdown of modern software monetization, building high-leverage products, and scaling without burning out.',
    categoryLabel: 'Caesar Mode',
    engineMode: 'Standard'
  },
  {
    id: 'vision_diagram_audit',
    category: 'engineering',
    title: 'Multimodal Vision & Schematic Audit',
    subtitle: 'Inspect uploaded diagrams, UI mockups, and infrastructure charts for security and layout flaws.',
    prompt: 'Provide a structured methodology for auditing complex system architecture diagrams and UI mockups using multimodal computer vision, identifying bottlenecks and single points of failure.',
    categoryLabel: 'Vision Cortex',
    engineMode: 'Standard'
  }
];

export const ARTIFACT_UI_TEMPLATES: ArtifactUITemplate[] = [
  {
    id: 'template-telemetry-matrix',
    title: 'Live Neural Telemetry & Latency Matrix',
    category: 'dashboard',
    categoryLabel: 'Telemetry Dashboard',
    type: 'code',
    language: 'html',
    description: 'Real-time oscilloscope wave canvas with live inference latency, GPU frame rates, and token counters.',
    tags: ['HTML5', 'Canvas', 'Telemetry', 'Live'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neural Cortex Telemetry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060a14;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 16px;
    }
    .title { font-size: 20px; font-weight: 700; color: #FAAD3F; letter-spacing: -0.02em; }
    .badge {
      background: rgba(250, 173, 63, 0.12);
      color: #FAAD3F;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid rgba(250, 173, 63, 0.3);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 18px;
      backdrop-filter: blur(8px);
    }
    .card-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card-val { font-size: 26px; font-weight: 700; color: #ffffff; }
    .canvas-container {
      background: #03060f;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
    }
    canvas { width: 100%; height: 180px; display: block; border-radius: 10px; }
    .controls { display: flex; gap: 12px; align-items: center; }
    button {
      background: #FAAD3F;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(255,255,255,0.06);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.12);
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">GOD AI Neural Core Telemetry</div>
      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Real-time inference metrics & waveform DSP pipeline</p>
    </div>
    <div class="badge">99% Intelligence Tier</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Active Transformer</div>
      <div class="card-val" style="color: #38bdf8;">Gemini 3.8</div>
    </div>
    <div class="card">
      <div class="card-label">Inference Latency</div>
      <div class="card-val" id="lat-val">128 ms</div>
    </div>
    <div class="card">
      <div class="card-label">Thinking Cortex</div>
      <div class="card-val" style="color: #a855f7;">32,768 Tok</div>
    </div>
    <div class="card">
      <div class="card-label">Hardware Render FPS</div>
      <div class="card-val" id="fps-val" style="color: #34d399;">60 fps</div>
    </div>
  </div>

  <div class="canvas-container">
    <div class="card-label" style="margin-bottom: 10px;">Real-Time Harmonic Synapse Oscilloscope</div>
    <canvas id="synapseCanvas"></canvas>
  </div>

  <div class="controls">
    <button onclick="pingEngine()">Trigger Neural Ping</button>
    <button class="btn-secondary" onclick="toggleWave()">Toggle Wave Complexity</button>
    <span id="pingStatus" style="font-size: 12px; color: #94a3b8; font-family: monospace;"></span>
  </div>

  <script>
    const canvas = document.getElementById('synapseCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = 360;

    let step = 0;
    let complexWave = true;

    function draw() {
      ctx.fillStyle = '#03060f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Primary Wave
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FAAD3F';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin((x + step) * 0.025) * 45 * Math.sin(step * 0.015) + (complexWave ? Math.cos(x * 0.01) * 25 : 0);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary Wave
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin((x - step * 1.4) * 0.018) * 55;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      step += 2;
      requestAnimationFrame(draw);
    }
    draw();

    function pingEngine() {
      const lat = Math.floor(95 + Math.random() * 55);
      document.getElementById('lat-val').innerText = lat + ' ms';
      document.getElementById('pingStatus').innerText = '✓ Ping resolved at ' + new Date().toLocaleTimeString();
    }

    function toggleWave() {
      complexWave = !complexWave;
    }
  </script>
</body>
</html>`
  },
  {
    id: 'template-saas-kpi-dashboard',
    title: 'SaaS Executive KPI & Growth Dashboard',
    category: 'dashboard',
    categoryLabel: 'SaaS Dashboard',
    type: 'code',
    language: 'html',
    description: 'Clean modern dark-mode executive dashboard with MRR metrics, conversion rate gauges, and activity feeds.',
    tags: ['Tailwind', 'SaaS', 'Metrics', 'Executive'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Operations Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#080d1a] text-slate-100 font-sans p-6 min-h-screen">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white">Platform Growth & Operations</h1>
        <p class="text-xs text-slate-400 mt-1">Real-time aggregate performance across 42 active edge regions</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          All Systems Operational
        </span>
      </div>
    </div>

    <!-- 4 Key Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-[#0e162b] border border-white/10 shadow-lg">
        <p class="text-xs uppercase tracking-wider text-slate-400 font-mono">Monthly Recurring Revenue</p>
        <h2 class="text-2xl font-bold text-white mt-2">$148,250</h2>
        <p class="text-xs text-emerald-400 mt-1 flex items-center gap-1">↑ 18.4% <span class="text-slate-500">vs last month</span></p>
      </div>

      <div class="p-5 rounded-2xl bg-[#0e162b] border border-white/10 shadow-lg">
        <p class="text-xs uppercase tracking-wider text-slate-400 font-mono">Active Concurrent Seats</p>
        <h2 class="text-2xl font-bold text-white mt-2">12,840</h2>
        <p class="text-xs text-emerald-400 mt-1 flex items-center gap-1">↑ 24.2% <span class="text-slate-500">week-over-week</span></p>
      </div>

      <div class="p-5 rounded-2xl bg-[#0e162b] border border-white/10 shadow-lg">
        <p class="text-xs uppercase tracking-wider text-slate-400 font-mono">P99 Edge Latency</p>
        <h2 class="text-2xl font-bold text-[#38bdf8] mt-2">42 ms</h2>
        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">⚡ Cloudflare Workers</p>
      </div>

      <div class="p-5 rounded-2xl bg-[#0e162b] border border-white/10 shadow-lg">
        <p class="text-xs uppercase tracking-wider text-slate-400 font-mono">Net Retention Rate</p>
        <h2 class="text-2xl font-bold text-[#FAAD3F] mt-2">134.6%</h2>
        <p class="text-xs text-emerald-400 mt-1 flex items-center gap-1">↑ 3.1% <span class="text-slate-500">expansion</span></p>
      </div>
    </div>

    <!-- Visual Activity & Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 p-6 rounded-2xl bg-[#0e162b] border border-white/10 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-white">Weekly Query Volume by Model</h3>
          <span class="text-xs font-mono text-slate-400">Total: 4.8M requests</span>
        </div>
        
        <div class="space-y-3 pt-2">
          <div>
            <div class="flex justify-between text-xs font-mono mb-1">
              <span>Gemini 3.8 Flash (Core)</span>
              <span class="text-[#FAAD3F] font-bold">58%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div class="bg-[#FAAD3F] h-2 rounded-full" style="width: 58%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-mono mb-1">
              <span>Thinking Cortex (Deep Proofs)</span>
              <span class="text-[#a855f7] font-bold">24%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div class="bg-[#a855f7] h-2 rounded-full" style="width: 24%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-mono mb-1">
              <span>Kokoro-82M Local Neural Voice</span>
              <span class="text-[#38bdf8] font-bold">18%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div class="bg-[#38bdf8] h-2 rounded-full" style="width: 18%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-[#0e162b] border border-white/10 space-y-4">
        <h3 class="text-sm font-semibold text-white">Live Regional Status</h3>
        <ul class="space-y-2.5 text-xs font-mono">
          <li class="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">us-east (Virginia)</span>
            <span class="text-emerald-400 font-bold">28ms · OK</span>
          </li>
          <li class="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">europe-west (London)</span>
            <span class="text-emerald-400 font-bold">34ms · OK</span>
          </li>
          <li class="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span class="text-slate-300">asia-east (Tokyo)</span>
            <span class="text-emerald-400 font-bold">48ms · OK</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'template-audio-equalizer',
    title: '10-Band Graphic Audio Equalizer & Spectrum',
    category: 'dsp',
    categoryLabel: 'Audio Visualizer',
    type: 'code',
    language: 'html',
    description: 'Interactive graphic equalizer with 10 frequency band sliders, real-time dB readout, and live spectrum visualizer.',
    tags: ['WebAudio', 'DSP', 'Equalizer', 'Interactive'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>10-Band Graphic Audio Equalizer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #070c18;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      padding: 24px;
    }
    .header { margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; }
    .title { font-size: 20px; font-weight: 700; color: #38bdf8; }
    .eq-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 12px;
      background: #040711;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 24px;
    }
    .eq-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .slider-wrapper {
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    input[type=range][orient=vertical] {
      writing-mode: bt-lr;
      -webkit-appearance: slider-vertical;
      width: 8px;
      height: 160px;
      accent-color: #FAAD3F;
      cursor: pointer;
    }
    .freq-label { font-size: 11px; font-family: monospace; color: #94a3b8; }
    .gain-val { font-size: 11px; font-weight: bold; color: #FAAD3F; font-family: monospace; }
    .spectrum-box {
      background: #03060f;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 16px;
    }
    canvas { width: 100%; height: 120px; display: block; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Ceeza Vocal DSP · 10-Band Parametric Equalizer</div>
    <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Hardware calibrated acoustic filtering & dynamic harmonic shaping</p>
  </div>

  <div class="eq-grid" id="eqGrid"></div>

  <div class="spectrum-box">
    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; font-family: monospace;">Live Output Spectrum FFT</div>
    <canvas id="specCanvas"></canvas>
  </div>

  <script>
    const freqs = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];
    const grid = document.getElementById('eqGrid');

    freqs.forEach((f, idx) => {
      const col = document.createElement('div');
      col.className = 'eq-column';
      const initialGain = Math.round(Math.sin(idx * 0.8) * 4);
      col.innerHTML = \`
        <span class="gain-val" id="gain-\${idx}">\${initialGain > 0 ? '+' : ''}\${initialGain}dB</span>
        <div class="slider-wrapper">
          <input type="range" orient="vertical" min="-12" max="12" value="\${initialGain}" oninput="updateGain(\${idx}, this.value)" />
        </div>
        <span class="freq-label">\${f}</span>
      \`;
      grid.appendChild(col);
    });

    function updateGain(idx, val) {
      document.getElementById('gain-' + idx).innerText = (val > 0 ? '+' : '') + val + 'dB';
    }

    // Spectrum Animation
    const canvas = document.getElementById('specCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = 240;

    let tick = 0;
    function renderSpectrum() {
      ctx.fillStyle = '#03060f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 48;
      const barWidth = canvas.width / bars - 4;

      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin((i + tick) * 0.15) * 80 + Math.cos(tick * 0.1) * 30 + 20);
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - height);
        grad.addColorStop(0, '#FAAD3F');
        grad.addColorStop(1, '#38bdf8');

        ctx.fillStyle = grad;
        ctx.fillRect(i * (barWidth + 4), canvas.height - height, barWidth, height);
      }

      tick += 0.5;
      requestAnimationFrame(renderSpectrum);
    }
    renderSpectrum();
  </script>
</body>
</html>`
  },
  {
    id: 'template-android-intent-hub',
    title: 'Android OS Assistant Intent Hub',
    category: 'mobile',
    categoryLabel: 'Mobile Intents',
    type: 'code',
    language: 'html',
    description: 'Interactive Android hardware intent dispatcher with working flashlight, countdown timers, and system notifications.',
    tags: ['Android', 'Mobile', 'Intents', 'Hardware'],
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Android Intent Dispatcher</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#050914] text-slate-100 p-6 font-sans min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md bg-[#0a1124] rounded-3xl border border-white/15 p-6 shadow-2xl space-y-5">
    <div class="flex items-center justify-between pb-3 border-b border-white/10">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <h2 class="text-sm font-bold uppercase tracking-wider font-mono text-white">Android System Hub</h2>
      </div>
      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">Android 15 API 35</span>
    </div>

    <!-- Quick Hardware Controls -->
    <div class="grid grid-cols-2 gap-3">
      <button id="torchBtn" onclick="toggleTorch()" class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-2 transition-all">
        <span id="torchIcon" class="text-2xl">🔦</span>
        <span class="text-xs font-semibold text-white">Flashlight</span>
        <span id="torchStatus" class="text-[10px] font-mono text-slate-400">OFF</span>
      </button>

      <button id="notifyBtn" onclick="triggerNotification()" class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-2 transition-all">
        <span class="text-2xl">🔔</span>
        <span class="text-xs font-semibold text-white">Test Notification</span>
        <span class="text-[10px] font-mono text-emerald-400">Simulate Alert</span>
      </button>
    </div>

    <!-- Active Timer Card -->
    <div class="p-4 rounded-2xl bg-[#111c38] border border-[#FAAD3F]/40 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-[#FAAD3F] font-mono">Countdown Timer</span>
        <span id="timerDisplay" class="text-xl font-bold font-mono text-white">00:30</span>
      </div>
      <div class="flex gap-2">
        <button onclick="startTimer(30)" class="flex-1 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs font-mono">30s Timer</button>
        <button onclick="startTimer(60)" class="flex-1 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs font-mono">60s Timer</button>
        <button onclick="stopTimer()" class="py-1.5 px-3 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs font-mono">Reset</button>
      </div>
    </div>

    <!-- Simulated Log -->
    <div class="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400 space-y-1">
      <p class="text-slate-500">// Device System Event Log</p>
      <div id="eventLog" class="h-16 overflow-y-auto space-y-0.5 text-slate-300">
        <div>> Android Intent Dispatcher initialized.</div>
      </div>
    </div>
  </div>

  <script>
    let torchState = false;
    let timerInterval = null;
    let secondsLeft = 30;

    function logEvent(msg) {
      const log = document.getElementById('eventLog');
      const item = document.createElement('div');
      item.innerText = '> ' + msg;
      log.appendChild(item);
      log.scrollTop = log.scrollHeight;
    }

    function toggleTorch() {
      torchState = !torchState;
      document.getElementById('torchStatus').innerText = torchState ? 'ACTIVE' : 'OFF';
      document.getElementById('torchStatus').style.color = torchState ? '#FAAD3F' : '#94a3b8';
      document.getElementById('torchBtn').style.borderColor = torchState ? '#FAAD3F' : 'rgba(255,255,255,0.1)';
      logEvent('Camera torch toggled ' + (torchState ? 'ON' : 'OFF'));
    }

    function triggerNotification() {
      logEvent('Triggered native notification: [Task Deadline]');
      alert('Android Assistant Notification: Your scheduled task reminder is active!');
    }

    function startTimer(duration) {
      clearInterval(timerInterval);
      secondsLeft = duration;
      updateDisplay();
      logEvent('Timer started for ' + duration + ' seconds');

      timerInterval = setInterval(() => {
        secondsLeft--;
        updateDisplay();
        if (secondsLeft <= 0) {
          clearInterval(timerInterval);
          logEvent('Timer FINISHED! Alarm ringing.');
          alert('Alarm: Timer completed!');
        }
      }, 1000);
    }

    function stopTimer() {
      clearInterval(timerInterval);
      secondsLeft = 0;
      updateDisplay();
      logEvent('Timer reset.');
    }

    function updateDisplay() {
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      document.getElementById('timerDisplay').innerText = 
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
  </script>
</body>
</html>`
  },
  {
    id: 'template-svg-pipeline-flow',
    title: 'Neural Lifecycle Pipeline State Machine',
    category: 'diagram',
    categoryLabel: 'Vector Diagram',
    type: 'svg',
    language: 'xml',
    description: 'High-resolution vector flowchart mapping user multimodal audio/vision inputs to thinking cortex and edge synthesis.',
    tags: ['SVG', 'Vector', 'Architecture', 'State Machine'],
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 440" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090f20"/>
      <stop offset="100%" stop-color="#04060d"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F38020"/>
      <stop offset="100%" stop-color="#FAAD3F"/>
    </linearGradient>
    <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="840" height="440" fill="url(#bgGrad2)" rx="20" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Connecting Lines -->
  <path d="M 190 220 L 340 130" stroke="#FAAD3F" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.8"/>
  <path d="M 190 220 L 340 310" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.8"/>
  <path d="M 500 130 L 650 220" stroke="#a855f7" stroke-width="2.5" opacity="0.8"/>
  <path d="M 500 310 L 650 220" stroke="#34d399" stroke-width="2.5" opacity="0.8"/>

  <!-- User Input Node -->
  <g transform="translate(90, 170)">
    <circle cx="50" cy="50" r="48" fill="#111a30" stroke="#FAAD3F" stroke-width="2"/>
    <circle cx="50" cy="50" r="10" fill="#FAAD3F" filter="url(#neon)"/>
    <text x="50" y="55" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold">INPUT</text>
  </g>

  <!-- Thinking Cortex Node -->
  <g transform="translate(340, 90)">
    <rect width="160" height="80" rx="14" fill="#1b1736" stroke="#a855f7" stroke-width="2"/>
    <text x="80" y="38" text-anchor="middle" fill="#c084fc" font-family="monospace" font-size="12" font-weight="bold">THINKING CORTEX</text>
    <text x="80" y="58" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">Multi-Step Deductions</text>
  </g>

  <!-- Search Grounding Node -->
  <g transform="translate(340, 270)">
    <rect width="160" height="80" rx="14" fill="#0b2438" stroke="#38bdf8" stroke-width="2"/>
    <text x="80" y="38" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">WEB GROUNDING</text>
    <text x="80" y="58" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="10">Verified Domain Index</text>
  </g>

  <!-- Output Node -->
  <g transform="translate(650, 170)">
    <circle cx="50" cy="50" r="50" fill="url(#accentGrad)" stroke="#ffffff" stroke-width="2"/>
    <text x="50" y="55" text-anchor="middle" fill="#000000" font-family="monospace" font-size="12" font-weight="bold">SYNTHESIS</text>
  </g>

  <text x="420" y="405" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="11">
    GOD AI Engine Lifecycle · Vector Architectural Specification
  </text>
</svg>`
  },
  {
    id: 'template-markdown-rfc-spec',
    title: 'Cross-Device Multi-Engine Architecture RFC',
    category: 'spec',
    categoryLabel: 'Technical RFC',
    type: 'markdown',
    language: 'markdown',
    description: 'Formal technical specification detailing bidirectional live voice pipelines, thinking cortex bounds, and cross-platform caching.',
    tags: ['RFC', 'Specification', 'Markdown', 'Systems'],
    content: `# GOD AI Cross-Device Multi-Engine Architecture RFC

## 1. Executive Summary
This RFC establishes the cross-device protocol standards for the GOD AI multi-engine orchestration platform, uniting real-time voice DSP, deep cognitive reasoning, and sandboxed code execution into a single, cohesive user experience.

### Core Architectural Pillars
- **Zero-Latency Neural Cortex**: Gemini 3.8 Flash transformer with optional multi-step thinking budget (up to 32k tokens).
- **Search Grounding Verification**: Live Google Search grounding with inline authoritative source links.
- **Bidirectional Vocal DSP**: 24,000 Hz WebAudio pipeline with dual-gain staging and echo suppression.
- **Client-Authoritative Workspaces**: Offline-resilient persistence synchronized across device sessions.

---

## 2. Latency & Resource Budgets

| Viewport Class | Network Target | Memory Ceiling | Audio Pipeline Target |
| :--- | :--- | :--- | :--- |
| **Mobile (Android/iOS)** | < 250 ms | 256 MB RAM | 16 kHz Mono PCM |
| **Tablet / Foldable** | < 200 ms | 512 MB RAM | 24 kHz Stereo PCM |
| **Desktop / Workstation** | < 120 ms | 1024 MB RAM | 24 kHz Full-Bandwidth DSP |

---

## 3. Sandboxed Artifact Runtime Invariants
1. Artifacts are isolated in a dual-sandboxed iframe environment with explicit origin restrictions.
2. Code evaluation executes client-side without transmitting proprietary user scripts to external servers.
3. Multi-device viewport emulation validates 375px (Mobile), 768px (Tablet), and 100% (Desktop) layout constraints.
`
  }
];
