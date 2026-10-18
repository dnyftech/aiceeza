import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Layers, 
  Code2, 
  FileText, 
  Eye, 
  Sparkles, 
  ExternalLink, 
  X, 
  Copy, 
  Check, 
  FolderKanban,
  Tag,
  Maximize2
} from 'lucide-react';
import { Artifact, ArtifactType, Workspace } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface D3ArtifactsGraphProps {
  artifacts: Artifact[];
  workspaces?: Workspace[];
  activeArtifactId?: string | null;
  onSelectArtifact: (id: string) => void;
  onOpenSandbox?: (id: string) => void;
  onOpenCode?: (id: string) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  nodeType: 'workspace' | 'artifact';
  artifactType?: ArtifactType;
  language?: string;
  version?: number;
  artifactId?: string;
  workspaceId?: string;
  tags?: string[];
  radius: number;
  color: string;
  strokeColor: string;
  contentSnippet?: string;
  contentLength?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: 'belongs_to' | 'shared_tag' | 'shared_type';
  isCrossLink?: boolean;
}

export const D3ArtifactsGraph: React.FC<D3ArtifactsGraphProps> = ({
  artifacts,
  workspaces = [],
  activeArtifactId,
  onSelectArtifact,
  onOpenSandbox,
  onOpenCode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  // Map workspace names for quick lookup
  const workspaceMap = useMemo(() => {
    const map = new Map<string, string>();
    workspaces.forEach((w) => map.set(w.id, w.name));
    map.set('ws-default', 'Primary Command');
    map.set('ws-1', 'Market Intel Matrix');
    map.set('ws-2', 'Neural Audio DSP');
    map.set('ws-3', 'Android OS Intents');
    return map;
  }, [workspaces]);

  // Color helper by artifact type
  const getTypeColor = (type?: ArtifactType) => {
    switch (type) {
      case 'code':
        return { fill: '#0284c7', stroke: '#38bdf8' }; // cyan / sky
      case 'markdown':
        return { fill: '#d97706', stroke: '#f59e0b' }; // amber
      case 'svg':
        return { fill: '#db2777', stroke: '#f472b6' }; // pink
      case 'table':
        return { fill: '#059669', stroke: '#10b981' }; // emerald
      default:
        return { fill: '#7c3aed', stroke: '#a78bfa' }; // violet
    }
  };

  // Build Graph Nodes and Links from artifacts & workspaces
  const { nodes, links } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];
    const workspaceIds = new Set<string>();

    // 1. Identify distinct workspaces present in artifacts + explicit workspaces list
    artifacts.forEach((a) => workspaceIds.add(a.workspaceId || 'ws-default'));
    workspaces.forEach((w) => workspaceIds.add(w.id));

    // 2. Create Workspace Hub Nodes
    workspaceIds.forEach((wsId) => {
      const wsObj = workspaces.find((w) => w.id === wsId);
      const name = wsObj ? wsObj.name : (workspaceMap.get(wsId) || `Workspace (${wsId})`);
      const childArtifacts = artifacts.filter((a) => (a.workspaceId || 'ws-default') === wsId);

      nodeList.push({
        id: `ws-${wsId}`,
        name,
        nodeType: 'workspace',
        workspaceId: wsId,
        radius: 32,
        color: '#d97706',
        strokeColor: '#FAAD3F',
        tags: wsObj?.tags || ['Workspace', 'Project Hub'],
        contentSnippet: `${childArtifacts.length} connected artifacts`,
      });
    });

    // 3. Create Artifact Nodes
    artifacts.forEach((art) => {
      const colors = getTypeColor(art.type);
      const isSelected = activeArtifactId === art.id;

      nodeList.push({
        id: `art-${art.id}`,
        artifactId: art.id,
        name: art.title,
        nodeType: 'artifact',
        artifactType: art.type,
        language: art.language,
        version: art.version,
        workspaceId: art.workspaceId || 'ws-default',
        tags: art.tags || [art.type.toUpperCase()],
        radius: isSelected ? 24 : 18,
        color: colors.fill,
        strokeColor: colors.stroke,
        contentSnippet: art.description || art.content.slice(0, 100).replace(/\n/g, ' '),
        contentLength: art.content.length,
      });

      // Edge 1: Primary relationship to parent workspace
      const targetWsId = art.workspaceId || 'ws-default';
      linkList.push({
        id: `link-${art.id}-to-${targetWsId}`,
        source: `ws-${targetWsId}`,
        target: `art-${art.id}`,
        relationship: 'belongs_to',
        isCrossLink: false,
      });
    });

    // 4. Create Semantic Cross-Links between artifacts that share tags or same language
    for (let i = 0; i < artifacts.length; i++) {
      for (let j = i + 1; j < artifacts.length; j++) {
        const a1 = artifacts[i];
        const a2 = artifacts[j];

        const sharedTag = a1.tags?.some((t) => a2.tags?.includes(t));
        const sharedLang = a1.language && a2.language && a1.language === a2.language;

        if (sharedTag || sharedLang) {
          linkList.push({
            id: `cross-${a1.id}-${a2.id}`,
            source: `art-${a1.id}`,
            target: `art-${a2.id}`,
            relationship: sharedTag ? 'shared_tag' : 'shared_type',
            isCrossLink: true,
          });
        }
      }
    }

    return { nodes: nodeList, links: linkList };
  }, [artifacts, workspaces, activeArtifactId, workspaceMap]);

  // Main D3 Force Simulation Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // SVG Defs for gradients, glowing filters, and markers
    const defs = svg.append('defs');

    // Glow filter for highlighted nodes
    const glowFilter = defs
      .append('filter')
      .attr('id', 'graph-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter
      .append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Grid pattern background
    const pattern = defs
      .append('pattern')
      .attr('id', 'graph-grid')
      .attr('width', 30)
      .attr('height', 30)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern
      .append('path')
      .attr('d', 'M 30 0 L 0 0 0 30')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.04)')
      .attr('stroke-width', '1');

    // Root background rect
    svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#graph-grid)')
      .on('click', () => {
        setSelectedNode(null);
      });

    // Root interactive group container
    const g = svg.append('g').attr('class', 'graph-viewport');

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Clone data for simulation so d3 mutation doesn't taint React memo
    const simNodes: GraphNode[] = nodes.map((d) => ({ ...d }));
    const simLinks: GraphLink[] = links.map((d) => ({ ...d }));

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => (d.isCrossLink ? 140 : 90))
          .strength((d) => (d.isCrossLink ? 0.25 : 0.7))
      )
      .force('charge', d3.forceManyBody().strength(-380))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 18));

    // Links container
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) =>
        d.isCrossLink ? 'rgba(56, 189, 248, 0.25)' : 'rgba(250, 173, 63, 0.45)'
      )
      .attr('stroke-width', (d) => (d.isCrossLink ? 1.2 : 2))
      .attr('stroke-dasharray', (d) => (d.isCrossLink ? '4,4' : 'none'));

    // Nodes container
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('.node-group')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('cursor', 'pointer');

    // Node outer selection glow ring
    node
      .append('circle')
      .attr('r', (d) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.id === `art-${activeArtifactId}` ? '#FAAD3F' : 'transparent'))
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '3,3')
      .attr('class', 'selection-ring');

    // Main node body circle
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.strokeColor)
      .attr('stroke-width', (d) => (d.nodeType === 'workspace' ? 3 : 2))
      .attr('filter', (d) => (d.id === `art-${activeArtifactId}` ? 'url(#graph-glow)' : 'none'))
      .attr('fill-opacity', 0.85);

    // Node icon / symbol
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => (d.nodeType === 'workspace' ? '14px' : '10px'))
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text((d) => {
        if (d.nodeType === 'workspace') return 'PROJECT';
        if (d.artifactType === 'code') return '</>';
        if (d.artifactType === 'svg') return 'SVG';
        if (d.artifactType === 'markdown') return 'DOC';
        if (d.artifactType === 'table') return 'TBL';
        return 'ART';
      });

    // Node text label underneath
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 14)
      .attr('font-size', (d) => (d.nodeType === 'workspace' ? '11px' : '10px'))
      .attr('font-family', 'sans-serif')
      .attr('font-weight', (d) => (d.nodeType === 'workspace' ? 'bold' : 'normal'))
      .attr('fill', (d) => (d.nodeType === 'workspace' ? '#FAAD3F' : '#cbd5e1'))
      .attr('stroke', '#000000')
      .attr('stroke-width', '2px')
      .attr('paint-order', 'stroke fill')
      .attr('pointer-events', 'none')
      .text((d) => {
        const maxLen = d.nodeType === 'workspace' ? 20 : 16;
        return d.name.length > maxLen ? `${d.name.slice(0, maxLen)}...` : d.name;
      });

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    // Node Click & Hover Interactions
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        triggerHaptic(15);
        setSelectedNode(d);
        if (d.nodeType === 'artifact' && d.artifactId) {
          onSelectArtifact(d.artifactId);
        }
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);

        // Highlight connected links and nodes
        link.attr('stroke-opacity', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.15
        );
        link.attr('stroke-width', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 3 : 1
        );
        node.attr('opacity', (n) => (n.id === d.id ? 1 : 0.35));
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        link.attr('stroke-opacity', 1).attr('stroke-width', (d) => (d.isCrossLink ? 1.2 : 2));
        node.attr('opacity', 1);
      });

    // Simulation tick loop
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, activeArtifactId, onSelectArtifact]);

  // Handle Zoom controls
  const handleZoomIn = () => {
    triggerHaptic(10);
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    triggerHaptic(10);
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    triggerHaptic(15);
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(350)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleCopyContent = async (text?: string) => {
    if (!text) return;
    try {
      triggerHaptic(15);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Find artifact object if an artifact node is selected
  const selectedArtifact = useMemo(() => {
    if (selectedNode?.nodeType === 'artifact' && selectedNode.artifactId) {
      return artifacts.find((a) => a.id === selectedNode.artifactId) || null;
    }
    return null;
  }, [selectedNode, artifacts]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-hidden select-none" ref={containerRef}>
      
      {/* Top Interactive Graph HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-[#090f1e]/90 backdrop-blur-md z-10 flex-shrink-0">
        
        {/* Title and stats */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40">
            <GitBranch size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Artifacts & Project Relationship Graph
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                D3 Force Matrix
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Interactive topology mapping project hubs, saved components, and cross-artifact semantic tags.
            </p>
          </div>
        </div>

        {/* Graph Controls & Legend */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-black/50 border border-white/10">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fit to Screen"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Graph Canvas */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Legend Overlay at bottom left */}
        <div className="absolute bottom-3 left-3 z-10 p-3 rounded-2xl bg-[#090f1e]/90 border border-white/10 backdrop-blur-md shadow-xl text-[10px] font-mono space-y-1.5 pointer-events-auto hidden sm:block">
          <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px] mb-1">
            Graph Topology Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FAAD3F] border border-amber-300" />
            <span className="text-slate-300">Workspace Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-[#38bdf8]" />
            <span className="text-slate-300">Code Artifact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] border border-[#f59e0b]" />
            <span className="text-slate-300">Markdown Spec</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#db2777] border border-[#f472b6]" />
            <span className="text-slate-300">SVG Graphic</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-slate-400 text-[9px]">
            <span className="border-t border-dashed border-[#38bdf8] w-4 inline-block" />
            <span>Semantic Tag Link</span>
          </div>
        </div>

        {/* Hover Tooltip Overlay */}
        <AnimatePresence>
          {hoveredNode && !selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-[#0b1222]/95 border border-[#FAAD3F]/40 shadow-2xl backdrop-blur-md text-white text-xs font-mono max-w-xs pointer-events-none"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredNode.strokeColor }} />
                <span className="font-bold text-white truncate">{hoveredNode.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2">
                {hoveredNode.contentSnippet}
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase">
                  {hoveredNode.nodeType}
                </span>
                {hoveredNode.language && (
                  <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] text-[9px]">
                    {hoveredNode.language}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Node Details Drawer on Right */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="absolute top-3 right-3 bottom-3 w-80 max-w-[90vw] z-30 p-4 rounded-2xl bg-[#0b1222]/95 border border-[#FAAD3F]/40 shadow-2xl backdrop-blur-xl text-white flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: selectedNode.strokeColor }} 
                    />
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 block">
                        {selectedNode.nodeType === 'workspace' ? 'Workspace Project Hub' : 'Artifact Component'}
                      </span>
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        {selectedNode.name}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Workspace Context */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Associated Project:</span>
                    <span className="text-[#FAAD3F] font-bold">
                      {workspaceMap.get(selectedNode.workspaceId || 'ws-default') || 'Primary Command'}
                    </span>
                  </div>
                  {selectedNode.artifactType && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Artifact Format:</span>
                      <span className="text-[#38bdf8] uppercase font-bold">{selectedNode.artifactType}</span>
                    </div>
                  )}
                  {selectedNode.version && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Iteration Version:</span>
                      <span className="text-slate-200">v{selectedNode.version}.0</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Tag size={11} /> Relationships & Semantic Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Snippet */}
                {selectedNode.contentSnippet && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Description / Code Snippet:
                    </span>
                    <pre className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[10px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {selectedNode.contentSnippet}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons if artifact */}
              {selectedArtifact && (
                <div className="pt-3 border-t border-white/10 space-y-2 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        onOpenSandbox?.(selectedArtifact.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-[#FAAD3F] text-black font-bold text-xs font-mono flex items-center justify-center gap-1 hover:brightness-110 shadow-md transition-all"
                    >
                      <Eye size={13} />
                      <span>Sandbox</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        onOpenCode?.(selectedArtifact.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-1"
                    >
                      <Code2 size={13} />
                      <span>Source</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopyContent(selectedArtifact.content)}
                    className="w-full py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied to Clipboard' : 'Copy Artifact Content'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
