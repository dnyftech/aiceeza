import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  FileText, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Layers, 
  ExternalLink, 
  Sparkles,
  Terminal,
  X,
  FileCode,
  Eye,
  GitBranch,
  Network,
  TrendingUp,
  LayoutTemplate,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { Artifact, ArtifactType, Workspace } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { D3ArtifactsGraph } from './D3ArtifactsGraph';
import { D3ArtifactsScatterPlot } from './D3ArtifactsScatterPlot';
import { ARTIFACT_UI_TEMPLATES, ArtifactUITemplate } from '../utils/uiTemplates';

interface ArtifactsWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: Artifact[];
  workspaces?: Workspace[];
  activeArtifactId?: string | null;
  onSelectArtifact: (id: string) => void;
  onSaveArtifact: (artifact: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
  onCreateArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void;
  workspaceName?: string;
}

export const ArtifactsWorkbench: React.FC<ArtifactsWorkbenchProps> = ({
  isOpen,
  onClose,
  artifacts,
  workspaces = [],
  activeArtifactId,
  onSelectArtifact,
  onSaveArtifact,
  onDeleteArtifact,
  onCreateArtifact,
  workspaceName = 'Primary Command',
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'graph' | 'scatter' | 'templates'>('preview');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [simulatedDevice, setSimulatedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ArtifactType>('code');
  const [newLanguage, setNewLanguage] = useState('html');
  const [newContent, setNewContent] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentArtifact = useMemo(() => {
    if (activeArtifactId) {
      const found = artifacts.find(a => a.id === activeArtifactId);
      if (found) return found;
    }
    return artifacts[0] || null;
  }, [artifacts, activeArtifactId]);

  useEffect(() => {
    if (currentArtifact) {
      setEditContent(currentArtifact.content);
      setIsEditing(false);
    }
  }, [currentArtifact?.id]);

  const handleCopy = async () => {
    if (!currentArtifact) return;
    try {
      triggerHaptic(15);
      await navigator.clipboard.writeText(currentArtifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownload = () => {
    if (!currentArtifact) return;
    triggerHaptic(15);
    let extension = 'txt';
    if (currentArtifact.type === 'code') {
      extension = currentArtifact.language === 'typescript' ? 'tsx' : (currentArtifact.language || 'html');
    } else if (currentArtifact.type === 'markdown') {
      extension = 'md';
    } else if (currentArtifact.type === 'svg') {
      extension = 'svg';
    } else if (currentArtifact.type === 'table') {
      extension = 'json';
    }

    const filename = `${currentArtifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`;
    const blob = new Blob([currentArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    if (!currentArtifact) return;
    triggerHaptic(20);
    onSaveArtifact({
      ...currentArtifact,
      content: editContent,
      updatedAt: new Date().toISOString(),
      version: currentArtifact.version + 1,
    });
    setIsEditing(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    triggerHaptic(20);
    onCreateArtifact({
      title: newTitle.trim(),
      type: newType,
      language: newLanguage,
      content: newContent,
      description: newDescription.trim() || undefined,
      workspaceId: 'ws-default',
      tags: [newType.toUpperCase(), newLanguage.toUpperCase()]
    });
    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
    setNewDescription('');
  };

  // Generate safe sandbox HTML payload for preview
  const sandboxHtml = useMemo(() => {
    if (!currentArtifact) return '';

    if (currentArtifact.type === 'svg') {
      return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#050811;display:flex;align-items:center;justify-content:center;height:100vh;box-sizing:border-box;">${currentArtifact.content}</body></html>`;
    }

    if (currentArtifact.type === 'markdown') {
      // Basic styled HTML presentation of markdown
      const escaped = currentArtifact.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #070c18; color: #e2e8f0; padding: 24px; line-height: 1.6; }
  h1, h2, h3 { color: #FAAD3F; }
  pre { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; }
  code { color: #38bdf8; font-family: monospace; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th, td { border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; text-align: left; }
  th { background: rgba(255,255,255,0.05); color: #FAAD3F; }
</style>
</head>
<body>
<pre style="white-space: pre-wrap; word-break: break-word;">${escaped}</pre>
</body>
</html>`;
    }

    if (currentArtifact.type === 'code') {
      // If HTML, render directly
      if (currentArtifact.language === 'html' || currentArtifact.content.includes('<html') || currentArtifact.content.includes('<!DOCTYPE')) {
        return currentArtifact.content;
      }

      // If generic JS/React/TS, wrap in safe container
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: monospace; background: #070c18; color: #e2e8f0; padding: 20px; }
  pre { background: #0b1120; padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); white-space: pre-wrap; font-size: 13px; }
</style>
</head>
<body>
<h4 style="color:#FAAD3F; margin-bottom: 8px;">[${currentArtifact.language?.toUpperCase() || 'CODE'} RUNTIME OUTPUT]</h4>
<pre>${currentArtifact.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    }

    return currentArtifact.content;
  }, [currentArtifact]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className={`relative w-full ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[92vh] rounded-3xl'
        } flex flex-col bg-[#070b14] border border-white/15 shadow-2xl overflow-hidden`}
      >
        {/* Top Workbench Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-gradient-to-r from-[#0f172a] via-[#111c33] to-[#0c1424] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F38020] to-[#FAAD3F] text-black font-bold flex items-center justify-center shadow-lg flex-shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white truncate font-display italic">
                  Artifacts Workbench
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                  {workspaceName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 font-bold flex-shrink-0">
                  {artifacts.length} {artifacts.length === 1 ? 'Artifact' : 'Artifacts'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">
                Interactive Code Sandbox, Multi-Device Emulator, Architectural Specs & Native Vector Diagrams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveTab(activeTab === 'graph' ? 'preview' : 'graph');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                activeTab === 'graph'
                  ? 'bg-[#38bdf8] text-black border-[#38bdf8] font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle D3 Relationship Graph"
            >
              <Network size={14} />
              <span className="hidden sm:inline">{activeTab === 'graph' ? 'Back to Sandbox' : 'Project Graph'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveTab(activeTab === 'templates' ? 'preview' : 'templates');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                activeTab === 'templates'
                  ? 'bg-[#34d399] text-black border-[#34d399] font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Browse Pre-Built UI Templates"
            >
              <LayoutTemplate size={14} />
              <span className="hidden sm:inline">{activeTab === 'templates' ? 'Back to Sandbox' : 'UI Templates'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setActiveTab(activeTab === 'scatter' ? 'preview' : 'scatter');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                activeTab === 'scatter'
                  ? 'bg-[#FAAD3F] text-black border-[#FAAD3F] font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle D3 Evolution Scatter Plot"
            >
              <TrendingUp size={14} />
              <span className="hidden sm:inline">{activeTab === 'scatter' ? 'Back to Sandbox' : 'Evolution Matrix'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs font-mono transition-all hover:brightness-110 cursor-pointer shadow-md"
              title="Create new artifact"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Artifact</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(10);
                setIsFullscreen(!isFullscreen);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors"
              title="Close Workbench"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Left Artifact Sidebar + Right Interactive Canvas */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Artifacts List Sidebar */}
          <div className="w-full md:w-72 lg:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#060a13] flex flex-col max-h-48 md:max-h-full overflow-y-auto">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Workspace Artifacts
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                v{currentArtifact?.version || 1}.0
              </span>
            </div>

            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
              {artifacts.map((art) => {
                const isSelected = currentArtifact?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => {
                      triggerHaptic(15);
                      onSelectArtifact(art.id);
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#121c31] border-[#FAAD3F]/60 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {art.type === 'code' && <Code2 size={13} className="text-[#38bdf8] flex-shrink-0" />}
                        {art.type === 'markdown' && <FileText size={13} className="text-[#a855f7] flex-shrink-0" />}
                        {art.type === 'svg' && <FileCode size={13} className="text-[#34d399] flex-shrink-0" />}
                        {art.type === 'table' && <Layers size={13} className="text-[#FAAD3F] flex-shrink-0" />}
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[#FAAD3F]' : 'text-slate-200'}`}>
                          {art.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 border border-white/5 flex-shrink-0">
                        {art.type}
                      </span>
                    </div>

                    {art.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                        {art.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-1 border-t border-white/5">
                      <span>{art.language || art.type}</span>
                      <span>v{art.version}.0</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Artifact Canvas & Sandbox */}
          {currentArtifact ? (
            <div className="flex-1 min-h-0 flex flex-col bg-[#070c17]">
              
              {/* Canvas Controls Bar */}
              <div className="px-4 py-2.5 border-b border-white/10 bg-[#090f1e] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                {/* View Switcher: Code / Live Preview */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10">
                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab('preview');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeTab === 'preview'
                        ? 'bg-[#FAAD3F] text-black font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Live Sandbox</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab('code');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeTab === 'code'
                        ? 'bg-[#FAAD3F] text-black font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 size={13} />
                    <span>Source Code</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab('graph');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeTab === 'graph'
                        ? 'bg-[#38bdf8] text-black font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Network size={13} />
                    <span>Project Graph</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab('scatter');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeTab === 'scatter'
                        ? 'bg-[#FAAD3F] text-black font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={13} />
                    <span>Evolution Scatter</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab('templates');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeTab === 'templates'
                        ? 'bg-[#34d399] text-black font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutTemplate size={13} />
                    <span>UI Templates</span>
                  </button>
                </div>

                {/* Device Viewport Emulator Controls (when in Live Preview) */}
                {activeTab === 'preview' && (
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10">
                    <button
                      onClick={() => {
                        triggerHaptic(10);
                        setSimulatedDevice('desktop');
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        simulatedDevice === 'desktop'
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Desktop (100% Full Width)"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(10);
                        setSimulatedDevice('tablet');
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        simulatedDevice === 'tablet'
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tablet (768px Viewport)"
                    >
                      <Tablet size={14} />
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(10);
                        setSimulatedDevice('mobile');
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        simulatedDevice === 'mobile'
                          ? 'bg-white/20 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Mobile (375px Viewport)"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                )}

                {/* Actions: Edit, Copy, Download, Refresh */}
                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono hover:bg-emerald-400 transition-all cursor-pointer"
                      title="Save changes to artifact"
                    >
                      <Save size={13} />
                      <span>Save Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        setIsEditing(true);
                        setActiveTab('code');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono transition-all"
                      title="Edit source directly"
                    >
                      <Edit3 size={13} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                    title="Download artifact file"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>

              {/* Canvas Content Area */}
              <div className="flex-1 min-h-0 relative p-3 sm:p-4 overflow-auto bg-[#03060f] flex items-center justify-center">
                {activeTab === 'graph' ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#050811]">
                    <D3ArtifactsGraph
                      artifacts={artifacts}
                      workspaces={workspaces}
                      activeArtifactId={currentArtifact?.id}
                      onSelectArtifact={onSelectArtifact}
                      onOpenSandbox={(id) => {
                        onSelectArtifact(id);
                        setActiveTab('preview');
                      }}
                      onOpenCode={(id) => {
                        onSelectArtifact(id);
                        setActiveTab('code');
                      }}
                    />
                  </div>
                ) : activeTab === 'scatter' ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#050811]">
                    <D3ArtifactsScatterPlot
                      artifacts={artifacts}
                      workspaces={workspaces}
                      activeArtifactId={currentArtifact?.id}
                      onSelectArtifact={onSelectArtifact}
                      onOpenSandbox={(id) => {
                        onSelectArtifact(id);
                        setActiveTab('preview');
                      }}
                      onOpenCode={(id) => {
                        onSelectArtifact(id);
                        setActiveTab('code');
                      }}
                      onSaveArtifact={onSaveArtifact}
                    />
                  </div>
                ) : activeTab === 'templates' ? (
                  <div className="w-full h-full rounded-2xl overflow-y-auto border border-white/10 p-4 sm:p-6 bg-[#040711] space-y-5">
                    {/* Template Gallery Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                          <LayoutTemplate size={16} className="text-[#34d399]" />
                          <span>Curated UI Templates & Executable Starters</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Production-grade telemetry grids, audio DSP equalizers, mobile intent hubs, and RFC specs ready to test.
                        </p>
                      </div>

                      {/* Zero-Pill Category Filter */}
                      <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'dashboard', label: 'Dashboards' },
                          { id: 'dsp', label: 'Audio DSP' },
                          { id: 'mobile', label: 'Mobile' },
                          { id: 'diagram', label: 'Diagrams' },
                          { id: 'spec', label: 'Specs' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              triggerHaptic(10);
                              setTemplateCategory(cat.id);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
                              templateCategory === cat.id
                                ? 'bg-white/15 text-white font-bold border border-white/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ARTIFACT_UI_TEMPLATES
                        .filter((t) => templateCategory === 'all' || t.category === templateCategory)
                        .map((tmpl) => (
                          <div
                            key={tmpl.id}
                            className="p-5 rounded-2xl bg-[#0a1020] border border-white/10 hover:border-[#34d399]/40 transition-all shadow-xl flex flex-col justify-between group text-left"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                  <span className="text-white font-semibold">{tmpl.categoryLabel}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[#34d399] uppercase">{tmpl.type}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-400">{tmpl.language}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {tmpl.content.length} bytes
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white group-hover:text-[#34d399] transition-colors">
                                {tmpl.title}
                              </h4>

                              <p className="text-xs text-slate-400 leading-relaxed font-light">
                                {tmpl.description}
                              </p>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {tmpl.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  triggerHaptic(10);
                                  await navigator.clipboard.writeText(tmpl.content);
                                  setCopiedTemplateId(tmpl.id);
                                  setTimeout(() => setCopiedTemplateId(null), 2000);
                                }}
                                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors p-1"
                              >
                                {copiedTemplateId === tmpl.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                <span>{copiedTemplateId === tmpl.id ? 'Copied' : 'Copy'}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic(15);
                                    if (currentArtifact) {
                                      setEditContent(tmpl.content);
                                      setIsEditing(true);
                                      setActiveTab('code');
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all border border-white/10"
                                >
                                  Edit Code
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic(20);
                                    onCreateArtifact({
                                      title: tmpl.title,
                                      type: tmpl.type,
                                      language: tmpl.language,
                                      description: tmpl.description,
                                      content: tmpl.content,
                                      workspaceId: currentArtifact?.workspaceId || 'ws-default',
                                      tags: tmpl.tags,
                                    });
                                    setActiveTab('preview');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#34d399] text-black font-bold text-xs font-mono hover:brightness-110 transition-all cursor-pointer shadow-md"
                                >
                                  <span>Save & Run</span>
                                  <ArrowRight size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : activeTab === 'preview' ? (
                  <div
                    className={`h-full transition-all duration-300 bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${
                      simulatedDevice === 'mobile'
                        ? 'w-[375px] max-w-full'
                        : simulatedDevice === 'tablet'
                        ? 'w-[768px] max-w-full'
                        : 'w-full'
                    }`}
                  >
                    <iframe
                      ref={iframeRef}
                      title={currentArtifact.title}
                      srcDoc={sandboxHtml}
                      sandbox="allow-scripts allow-modals allow-same-origin"
                      className="w-full h-full border-none bg-white"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#090e1c] border border-white/10 p-4 font-mono text-xs overflow-auto">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-full bg-transparent text-emerald-300 outline-none resize-none font-mono text-xs leading-relaxed"
                        placeholder="Write or edit artifact code..."
                      />
                    ) : (
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-mono">
                        {currentArtifact.content}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Canvas Telemetry Footer */}
              <div className="px-4 py-2 border-t border-white/10 bg-[#090f1e] flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeTab === 'graph' ? (
                    <>
                      <span>D3 Graph Active</span>
                      <span>·</span>
                      <span>{artifacts.length} Artifacts Mapped</span>
                      <span>·</span>
                      <span>{workspaces.length || 1} Workspaces</span>
                    </>
                  ) : activeTab === 'scatter' ? (
                    <>
                      <span>D3 Scatter Evolution Matrix Active</span>
                      <span>·</span>
                      <span>Version History & Dependencies Mapped</span>
                      <span>·</span>
                      <span>{artifacts.length} Artifacts</span>
                    </>
                  ) : activeTab === 'templates' ? (
                    <>
                      <span>UI Template Gallery</span>
                      <span>·</span>
                      <span>{ARTIFACT_UI_TEMPLATES.length} Production Starters</span>
                      <span>·</span>
                      <span>1-Click Load & Run</span>
                    </>
                  ) : (
                    <>
                      <span>Sandbox Active</span>
                      <span>·</span>
                      <span>{currentArtifact.content.length} chars</span>
                      <span>·</span>
                      <span>Format: {currentArtifact.type.toUpperCase()}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>Workspace: {workspaceName}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Layers size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">No Artifacts Available</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Create an artifact or ask GOD AI in chat to synthesize a code dashboard, SVG diagram, or RFC spec.
              </p>
            </div>
          )}

        </div>
      </motion.div>

      {/* Create Artifact Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div 
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-[#0d1424] border border-[#FAAD3F]/40 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white font-display italic">
                  Create New Artifact
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick Template Starters */}
              <div className="space-y-1.5 pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Scaffold from UI Template
                  </span>
                  <span className="text-[10px] font-mono text-[#34d399]">1-Click Preload</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ARTIFACT_UI_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        setNewTitle(tmpl.title);
                        setNewType(tmpl.type);
                        setNewLanguage(tmpl.language);
                        setNewDescription(tmpl.description);
                        setNewContent(tmpl.content);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:border-[#34d399]/40 group"
                    >
                      <p className="text-[11px] font-semibold text-white group-hover:text-[#34d399] transition-colors truncate">
                        {tmpl.title}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">
                        {tmpl.categoryLabel}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Artifact Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Live WebSocket Telemetry Grid"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#FAAD3F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      Artifact Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ArtifactType)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                    >
                      <option value="code">Code (Executable)</option>
                      <option value="markdown">Markdown Doc</option>
                      <option value="svg">SVG Diagram</option>
                      <option value="table">Data Table</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      Language / Syntax
                    </label>
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                    >
                      <option value="html">HTML / CSS / JS</option>
                      <option value="typescript">TypeScript / React</option>
                      <option value="markdown">Markdown</option>
                      <option value="svg">SVG Vector</option>
                      <option value="json">JSON Data</option>
                      <option value="python">Python</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short summary of this component..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#FAAD3F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Initial Content / Code
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste code or markdown here..."
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-emerald-300 font-mono text-xs outline-none focus:border-[#FAAD3F] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FAAD3F] hover:brightness-110 text-black font-bold text-xs font-mono shadow-lg"
                  >
                    Create Artifact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
