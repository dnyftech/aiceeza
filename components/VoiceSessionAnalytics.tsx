import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Mic, 
  Activity, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Cpu, 
  Layers, 
  Calendar,
  Volume2,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface VoiceAnalyticsProps {
  totalQueries?: number;
  totalVoiceSessions?: number;
}

// 7-day historical dataset
const DATA_7D = [
  { day: 'Mon', date: 'Oct 12', queries: 142, voiceSessions: 38, avgDurationSec: 185, kokoroRatio: 32, geminiRatio: 68 },
  { day: 'Tue', date: 'Oct 13', queries: 188, voiceSessions: 52, avgDurationSec: 210, kokoroRatio: 40, geminiRatio: 60 },
  { day: 'Wed', date: 'Oct 14', queries: 235, voiceSessions: 74, avgDurationSec: 245, kokoroRatio: 45, geminiRatio: 55 },
  { day: 'Thu', date: 'Oct 15', queries: 196, voiceSessions: 61, avgDurationSec: 195, kokoroRatio: 38, geminiRatio: 62 },
  { day: 'Fri', date: 'Oct 16', queries: 278, voiceSessions: 94, avgDurationSec: 280, kokoroRatio: 52, geminiRatio: 48 },
  { day: 'Sat', date: 'Oct 17', queries: 312, voiceSessions: 118, avgDurationSec: 320, kokoroRatio: 58, geminiRatio: 42 },
  { day: 'Sun', date: 'Oct 18', queries: 265, voiceSessions: 89, avgDurationSec: 260, kokoroRatio: 48, geminiRatio: 52 },
];

// 14-day historical dataset
const DATA_14D = [
  { day: 'Oct 5', date: 'Oct 5', queries: 110, voiceSessions: 28, avgDurationSec: 160 },
  { day: 'Oct 6', date: 'Oct 6', queries: 135, voiceSessions: 34, avgDurationSec: 175 },
  { day: 'Oct 7', date: 'Oct 7', queries: 160, voiceSessions: 42, avgDurationSec: 190 },
  { day: 'Oct 8', date: 'Oct 8', queries: 145, voiceSessions: 39, avgDurationSec: 180 },
  { day: 'Oct 9', date: 'Oct 9', queries: 175, voiceSessions: 50, avgDurationSec: 205 },
  { day: 'Oct 10', date: 'Oct 10', queries: 210, voiceSessions: 68, avgDurationSec: 230 },
  { day: 'Oct 11', date: 'Oct 11', queries: 190, voiceSessions: 55, avgDurationSec: 215 },
  { day: 'Oct 12', date: 'Oct 12', queries: 142, voiceSessions: 38, avgDurationSec: 185 },
  { day: 'Oct 13', date: 'Oct 13', queries: 188, voiceSessions: 52, avgDurationSec: 210 },
  { day: 'Oct 14', date: 'Oct 14', queries: 235, voiceSessions: 74, avgDurationSec: 245 },
  { day: 'Oct 15', date: 'Oct 15', queries: 196, voiceSessions: 61, avgDurationSec: 195 },
  { day: 'Oct 16', date: 'Oct 16', queries: 278, voiceSessions: 94, avgDurationSec: 280 },
  { day: 'Oct 17', date: 'Oct 17', queries: 312, voiceSessions: 118, avgDurationSec: 320 },
  { day: 'Oct 18', date: 'Oct 18', queries: 265, voiceSessions: 89, avgDurationSec: 260 },
];

// 24-Hour hourly usage profile
const DATA_HOURLY = [
  { hour: '00:00', queries: 24, voiceSessions: 6 },
  { hour: '02:00', queries: 12, voiceSessions: 2 },
  { hour: '04:00', queries: 8, voiceSessions: 1 },
  { hour: '06:00', queries: 35, voiceSessions: 12 },
  { hour: '08:00', queries: 115, voiceSessions: 44 },
  { hour: '10:00', queries: 184, voiceSessions: 68 },
  { hour: '12:00', queries: 210, voiceSessions: 82 },
  { hour: '14:00', queries: 195, voiceSessions: 76 },
  { hour: '16:00', queries: 220, voiceSessions: 90 },
  { hour: '18:00', queries: 198, voiceSessions: 72 },
  { hour: '20:00', queries: 165, voiceSessions: 58 },
  { hour: '22:00', queries: 85, voiceSessions: 30 },
];

const ENGINE_DISTRIBUTION = [
  { name: 'Gemini 3.8 Neural', value: 52, color: '#FAAD3F' },
  { name: 'Kokoro-82M Local', value: 38, color: '#38bdf8' },
  { name: 'Web Speech API', value: 10, color: '#34A853' },
];

const PERSONALITY_DISTRIBUTION = [
  { name: 'Caesar (Street Smart)', value: 45, color: '#FAAD3F' },
  { name: 'Concise Engineer', value: 28, color: '#38bdf8' },
  { name: 'Casual Guide', value: 17, color: '#34A853' },
  { name: 'Creative Muse', value: 10, color: '#a855f7' },
];

// Custom dark styled tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#090e1a]/95 border border-[#FAAD3F]/40 shadow-xl backdrop-blur-md text-white text-xs font-mono space-y-1 z-50">
        <p className="font-bold text-slate-300 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const VoiceSessionAnalytics: React.FC<VoiceAnalyticsProps> = ({
  totalQueries = 1716,
  totalVoiceSessions = 526,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '24h'>('7d');
  const [metricMode, setMetricMode] = useState<'both' | 'queries' | 'voice'>('both');

  const chartData = useMemo(() => {
    if (timeRange === '7d') return DATA_7D;
    if (timeRange === '14d') return DATA_14D;
    return DATA_HOURLY;
  }, [timeRange]);

  const xKey = timeRange === '24h' ? 'hour' : 'day';

  // Aggregate stats
  const totalVolume = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.queries || 0), 0);
  }, [chartData]);

  const totalSessions = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.voiceSessions || 0), 0);
  }, [chartData]);

  const avgVoiceRatio = useMemo(() => {
    if (!totalVolume) return '0%';
    return `${Math.round((totalSessions / totalVolume) * 100)}%`;
  }, [totalVolume, totalSessions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Section Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#0b1322] to-[#09101c] border border-[#FAAD3F]/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FAAD3F]/20 to-[#F38020]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 shadow-md">
            <BarChart3 size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-display italic flex items-center gap-2">
              Voice Session Analytics
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 not-italic font-bold">
                Live Telemetry
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Historical query volume, continuous speech engagement metrics, and neural engine distribution.
            </p>
          </div>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 self-start sm:self-auto">
          {(['7d', '14d', '24h'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                triggerHaptic(10);
                setTimeRange(range);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                timeRange === range
                  ? 'bg-[#FAAD3F] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '24 Hours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b1222] border border-white/10 relative overflow-hidden group hover:border-[#FAAD3F]/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FAAD3F]/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Total Spoken Queries</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono">{totalVolume.toLocaleString()}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center">
              <TrendingUp size={10} className="mr-0.5" /> +14.2%
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">Multi-turn conversations</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1222] border border-white/10 relative overflow-hidden group hover:border-[#38bdf8]/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#38bdf8]/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Voice Sessions</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#38bdf8] font-mono">{totalSessions.toLocaleString()}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center">
              <TrendingUp size={10} className="mr-0.5" /> +22.8%
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">Live link & Ceeza audio</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1222] border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Voice Usage Ratio</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{avgVoiceRatio}</span>
            <span className="text-[10px] font-mono text-slate-400">of all queries</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">High voice engagement</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1222] border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Avg Session Length</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-purple-300 font-mono">3m 48s</span>
            <span className="text-[10px] font-mono text-slate-400">continuous</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">Full-duplex conversation</span>
        </div>
      </div>

      {/* Main Chart: Historical Queries & Voice Sessions */}
      <div className="p-5 rounded-2xl bg-[#0b1222] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#FAAD3F] font-bold flex items-center gap-1.5">
              <Activity size={14} /> Historical Queries vs Voice Sessions
            </h4>
            <span className="text-[11px] text-slate-400">
              Interactive timeline showing conversational throughput and voice interaction frequency.
            </span>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10">
            <button
              onClick={() => setMetricMode('both')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                metricMode === 'both' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setMetricMode('queries')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                metricMode === 'queries' ? 'bg-[#FAAD3F] text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Queries
            </button>
            <button
              onClick={() => setMetricMode('voice')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                metricMode === 'voice' ? 'bg-[#38bdf8] text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voice Sessions
            </button>
          </div>
        </div>

        {/* Recharts Area / Bar Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FAAD3F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FAAD3F" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="voiceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis 
                dataKey={xKey} 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              {(metricMode === 'both' || metricMode === 'queries') && (
                <Area 
                  type="monotone" 
                  dataKey="queries" 
                  name="Total Queries" 
                  stroke="#FAAD3F" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#queryGrad)" 
                />
              )}
              {(metricMode === 'both' || metricMode === 'voice') && (
                <Area 
                  type="monotone" 
                  dataKey="voiceSessions" 
                  name="Voice Sessions" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#voiceGrad)" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Column: Hourly Distribution + Engine & Personality Mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Hourly Pattern Chart */}
        <div className="p-5 rounded-2xl bg-[#0b1222] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
              <Clock size={13} className="text-[#38bdf8]" /> Hourly Engagement Curve
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Peak: 12:00 - 16:00</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Average distribution of voice requests throughout a 24-hour cycle.
          </p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA_HOURLY} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="voiceSessions" name="Voice Sessions" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engine Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-[#0b1222] border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
                <Cpu size={13} className="text-[#FAAD3F]" /> Voice Engine Distribution
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Total Share</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Share of audio generation between Gemini Cloud Neural, Kokoro-82M Local, and Web Speech.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <div className="h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={ENGINE_DISTRIBUTION}
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {ENGINE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-mono flex-1">
              {ENGINE_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 text-[11px] font-sans font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Primary Voice Persona:</span>
            <span className="text-[#FAAD3F] font-bold">Caesar (Zephyr 45%)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
