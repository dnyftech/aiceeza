import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, BarChart3, Waves, Radio, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type D3VisualizerMode = 'spectrum' | 'radial' | 'waveform' | 'intensity_gauge';

interface D3FrequencyVisualizerProps {
  analyser?: AnalyserNode | null;
  isActive: boolean;
  isBotSpeaking?: boolean;
  className?: string;
}

export const D3FrequencyVisualizer: React.FC<D3FrequencyVisualizerProps> = ({
  analyser,
  isActive,
  isBotSpeaking = false,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<D3VisualizerMode>('spectrum');
  const [averageIntensity, setAverageIntensity] = useState<number>(0);
  const [peakFrequencyHz, setPeakFrequencyHz] = useState<number>(0);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;

    const width = container.clientWidth || 360;
    const height = 110;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove(); // clear prior elements
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Gradient 1: Bot Vocal Gradient (Emerald -> Gold -> Cyan)
    const botGrad = defs.append('linearGradient')
      .attr('id', 'd3-bot-grad')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');
    botGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.8);
    botGrad.append('stop').attr('offset', '50%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.9);
    botGrad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 1);

    // Gradient 2: User Voice Gradient (Deep Orange -> Gold -> Neon Flame)
    const userGrad = defs.append('linearGradient')
      .attr('id', 'd3-user-grad')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');
    userGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ea580c').attr('stop-opacity', 0.8);
    userGrad.append('stop').attr('offset', '60%').attr('stop-color', '#FAAD3F').attr('stop-opacity', 0.95);
    userGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 1);

    // Area Fill Gradient for Waveform
    const waveAreaGrad = defs.append('linearGradient')
      .attr('id', 'd3-wave-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    waveAreaGrad.append('stop').attr('offset', '0%').attr('stop-color', isBotSpeaking ? '#10b981' : '#FAAD3F').attr('stop-opacity', 0.35);
    waveAreaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a').attr('stop-opacity', 0);

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'd3-glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const mainGroup = svg.append('g').attr('class', 'main-vis-group');

    const BIN_COUNT = 48;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);
    const timeDomainArray = new Uint8Array(analyser ? analyser.fftSize : 128);

    const render = () => {
      let rawFrequencies: number[] = [];
      let rawTimeData: number[] = [];

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeDomainArray);

        const step = Math.max(1, Math.floor(dataArray.length / BIN_COUNT));
        for (let i = 0; i < BIN_COUNT; i++) {
          rawFrequencies.push(dataArray[i * step] || 0);
        }
        for (let i = 0; i < BIN_COUNT; i++) {
          rawTimeData.push(timeDomainArray[i * step] || 128);
        }
      } else if (isActive) {
        // Fallback smooth harmonic generation
        const t = Date.now() * 0.004;
        const amp = isBotSpeaking ? 160 : 80;
        const base = isBotSpeaking ? 50 : 25;
        for (let i = 0; i < BIN_COUNT; i++) {
          const s1 = Math.sin(t + i * 0.25) * amp;
          const s2 = Math.cos(t * 1.5 + i * 0.15) * (amp * 0.5);
          const v = Math.max(15, Math.min(255, Math.round(base + Math.abs(s1 + s2))));
          rawFrequencies.push(v);
          rawTimeData.push(128 + Math.round((Math.sin(t * 2 + i * 0.3) * 45)));
        }
      } else {
        // Idle quiescent state
        rawFrequencies = new Array(BIN_COUNT).fill(6);
        rawTimeData = new Array(BIN_COUNT).fill(128);
      }

      // Compute live stats
      const sum = rawFrequencies.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / rawFrequencies.length);
      const maxVal = Math.max(...rawFrequencies);
      const maxIdx = rawFrequencies.indexOf(maxVal);
      // Rough Hz approximation (Nyquist 24kHz / bin ratio)
      const approxHz = Math.round((maxIdx / BIN_COUNT) * 4000) + 120;
      setAverageIntensity(avg);
      setPeakFrequencyHz(approxHz);

      const colorFill = isBotSpeaking ? 'url(#d3-bot-grad)' : 'url(#d3-user-grad)';
      const strokeColor = isBotSpeaking ? '#34d399' : '#FAAD3F';

      mainGroup.selectAll('*').remove();

      if (visualMode === 'spectrum') {
        // --- D3 BAR SPECTRUM WITH PEAKS ---
        const xBand = d3.scaleBand()
          .domain(d3.range(BIN_COUNT).map(String))
          .range([8, width - 8])
          .paddingInner(0.22);

        const yScale = d3.scaleLinear()
          .domain([0, 255])
          .range([height - 12, 10]);

        // Draw frequency bars
        mainGroup.selectAll('.freq-bar')
          .data(rawFrequencies)
          .enter()
          .append('rect')
          .attr('class', 'freq-bar')
          .attr('x', (_, i) => xBand(String(i)) || 0)
          .attr('y', d => yScale(d))
          .attr('width', xBand.bandwidth())
          .attr('height', d => Math.max(3, (height - 12) - yScale(d)))
          .attr('rx', 2.5)
          .attr('fill', colorFill)
          .attr('filter', avg > 60 ? 'url(#d3-glow)' : null);

        // Peak dots along spectrum tops
        mainGroup.selectAll('.peak-dot')
          .data(rawFrequencies.filter((_, i) => i % 2 === 0))
          .enter()
          .append('circle')
          .attr('class', 'peak-dot')
          .attr('cx', (_, i) => (xBand(String(i * 2)) || 0) + xBand.bandwidth() / 2)
          .attr('cy', d => Math.max(6, yScale(d) - 3))
          .attr('r', 1.8)
          .attr('fill', strokeColor)
          .attr('opacity', d => (d > 40 ? 0.9 : 0.3));

      } else if (visualMode === 'waveform') {
        // --- D3 SMOOTH CURVED WAVEFORM & AREA ---
        const xScale = d3.scaleLinear()
          .domain([0, BIN_COUNT - 1])
          .range([6, width - 6]);

        const yScaleWave = d3.scaleLinear()
          .domain([0, 255])
          .range([height - 10, 10]);

        const lineGenerator = d3.line<number>()
          .x((_, i) => xScale(i))
          .y(d => yScaleWave(d))
          .curve(d3.curveCatmullRom.alpha(0.5));

        const areaGenerator = d3.area<number>()
          .x((_, i) => xScale(i))
          .y0(height - 10)
          .y1(d => yScaleWave(d))
          .curve(d3.curveCatmullRom.alpha(0.5));

        // Area under curve
        mainGroup.append('path')
          .datum(rawTimeData)
          .attr('class', 'wave-area')
          .attr('d', areaGenerator)
          .attr('fill', 'url(#d3-wave-area-grad)');

        // Glowing center stroke
        mainGroup.append('path')
          .datum(rawTimeData)
          .attr('class', 'wave-stroke')
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2.5)
          .attr('filter', 'url(#d3-glow)');

        // Mirror baseline reflection
        mainGroup.append('line')
          .attr('x1', 6).attr('y1', height / 2)
          .attr('x2', width - 6).attr('y2', height / 2)
          .attr('stroke', '#334155')
          .attr('stroke-dasharray', '3,3')
          .attr('stroke-width', 1);

      } else if (visualMode === 'radial') {
        // --- D3 RADIAL FREQUENCY ROSE ---
        const cx = width / 2;
        const cy = height / 2;
        const innerRadius = 18;
        const maxRadius = Math.min(width, height) / 2 - 4;

        const radialScale = d3.scaleLinear()
          .domain([0, 255])
          .range([innerRadius, maxRadius]);

        const angleScale = d3.scaleLinear()
          .domain([0, BIN_COUNT])
          .range([0, 2 * Math.PI]);

        // Draw radial spikes
        mainGroup.selectAll('.radial-spike')
          .data(rawFrequencies)
          .enter()
          .append('line')
          .attr('class', 'radial-spike')
          .attr('x1', (_, i) => cx + innerRadius * Math.cos(angleScale(i) - Math.PI / 2))
          .attr('y1', (_, i) => cy + innerRadius * Math.sin(angleScale(i) - Math.PI / 2))
          .attr('x2', (d, i) => cx + radialScale(d) * Math.cos(angleScale(i) - Math.PI / 2))
          .attr('y2', (d, i) => cy + radialScale(d) * Math.sin(angleScale(i) - Math.PI / 2))
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('opacity', d => Math.max(0.3, d / 255));

        // Center hub circle
        mainGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', innerRadius - 2)
          .attr('fill', '#090e17')
          .attr('stroke', strokeColor)
          .attr('stroke-width', 1.5)
          .attr('filter', 'url(#d3-glow)');

      } else if (visualMode === 'intensity_gauge') {
        // --- D3 INTENSITY GAUGE / METER BANDS ---
        const barHeight = 8;
        const yTop = height / 2 - 16;
        const normalizedInt = Math.min(100, (avg / 200) * 100);

        // Outer track
        mainGroup.append('rect')
          .attr('x', 24)
          .attr('y', yTop)
          .attr('width', width - 48)
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', '#1e293b');

        // Active intensity fill
        const fillWidth = Math.max(6, ((width - 48) * (normalizedInt / 100)));
        mainGroup.append('rect')
          .attr('x', 24)
          .attr('y', yTop)
          .attr('width', fillWidth)
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', colorFill)
          .attr('filter', 'url(#d3-glow)');

        // Segment markers
        const segments = 10;
        const segWidth = (width - 48) / segments;
        for (let s = 1; s < segments; s++) {
          mainGroup.append('line')
            .attr('x1', 24 + s * segWidth)
            .attr('y1', yTop - 3)
            .attr('x2', 24 + s * segWidth)
            .attr('y2', yTop + barHeight + 3)
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2);
        }

        // dB / Decibel markers underneath
        const labels = ['-40dB', '-24dB', '-12dB', '-6dB', '0dB'];
        labels.forEach((lbl, i) => {
          const lx = 24 + (i / (labels.length - 1)) * (width - 48);
          mainGroup.append('text')
            .attr('x', lx)
            .attr('y', yTop + barHeight + 20)
            .attr('fill', '#64748b')
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('text-anchor', i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle')
            .text(lbl);
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive, isBotSpeaking, visualMode]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-[#090e17]/85 border border-white/10 shadow-2xl backdrop-blur-xl p-3.5 overflow-hidden ${className}`}
    >
      {/* Visualizer Header: Mode selector & live telemetry */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300">
            <Activity size={13} className={isBotSpeaking ? 'text-[#34d399] animate-pulse' : 'text-[#FAAD3F] animate-pulse'} />
            <span>D3 Real-Time Frequency</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/10 text-slate-400">
            {peakFrequencyHz} Hz
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => {
              triggerHaptic(10);
              setVisualMode('spectrum');
            }}
            title="Frequency Spectrum (FFT Bars)"
            className={`p-1 rounded text-xs transition-all ${
              visualMode === 'spectrum' ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={13} />
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              setVisualMode('waveform');
            }}
            title="Curved Time-Domain Waveform"
            className={`p-1 rounded text-xs transition-all ${
              visualMode === 'waveform' ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves size={13} />
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              setVisualMode('radial');
            }}
            title="Radial Harmonic Rose"
            className={`p-1 rounded text-xs transition-all ${
              visualMode === 'radial' ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={13} />
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              setVisualMode('intensity_gauge');
            }}
            title="Vocal Intensity Gauge"
            className={`p-1 rounded text-xs transition-all ${
              visualMode === 'intensity_gauge' ? 'bg-[#FAAD3F]/20 text-[#FAAD3F] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={13} />
          </button>
        </div>
      </div>

      {/* D3 Canvas Render Container */}
      <div className="relative w-full flex items-center justify-center">
        <svg 
          ref={svgRef} 
          className="w-full h-[100px] block" 
        />
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Stream: {isBotSpeaking ? 'Ceeza Voice Output' : isActive ? 'Mic Input Active' : 'Idle'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Gain: {Math.round((averageIntensity / 255) * 100)}%</span>
          <span className="text-slate-600">|</span>
          <span className="text-[#FAAD3F] uppercase text-[9px]">{visualMode.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
};
