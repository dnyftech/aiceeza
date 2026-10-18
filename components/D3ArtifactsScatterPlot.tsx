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
  X, 
  Copy, 
  Check, 
  Tag,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  FileCode,
  Sliders,
  Filter,
  Activity,
  Maximize2
} from 'lucide-react';
import { Artifact, ArtifactType, Workspace, ArtifactVersionRecord } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface D3ArtifactsScatterPlotProps {
  artifacts: Artifact[];
  workspaces?: Workspace[];
  activeArtifactId?: string | null;
  onSelectArtifact: (id: string) => void;
  onOpenSandbox?: (id: string) => void;
  onOpenCode?: (id: string) => void;
  onSaveArtifact?: (artifact: Artifact) => void;
}

export type YAxisMetric = 'size' | 'version' | 'lines';

interface ScatterPoint {
  id: string;
  artifactId: string;
  title: string;
  version: number;
  type: ArtifactType;
  language?: string;
  workspaceId: string;
  workspaceName: string;
  timestamp: Date;
  sizeBytes: number;
  loc: number;
  summary?: string;
  isCurrentVersion: boolean;
  parentId?: string;
  dependencies: string[];
  tags: string[];
  content: string;
  color: string;
  strokeColor: string;
  x?: number;
  y?: number;
}

interface ScatterLink {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint?: ScatterPoint;
  targetPoint?: ScatterPoint;
  type: 'evolution' | 'dependency';
  label?: string;
}

export const D3ArtifactsScatterPlot: React.FC<D3ArtifactsScatterPlotProps> = ({
  artifacts,
  workspaces = [],
  activeArtifactId,
  onSelectArtifact,
  onOpenSandbox,
  onOpenCode,
  onSaveArtifact,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [yMetric, setYMetric] = useState<YAxisMetric>('size');
  const [selectedPoint, setSelectedPoint] = useState<ScatterPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showEvolutionLines, setShowEvolutionLines] = useState(true);
  const [showDependencyLines, setShowDependencyLines] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');

  // Workspace Name map
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

  // Build Scatter Points including Version History
  const { points, links } = useMemo(() => {
    const ptList: ScatterPoint[] = [];
    const linkList: ScatterLink[] = [];
    const now = new Date();

    artifacts.forEach((art, artIndex) => {
      const colors = getTypeColor(art.type);
      const wsName = workspaceMap.get(art.workspaceId || 'ws-default') || 'Primary Command';
      const linesCount = art.content.split('\n').length;
      const baseCreated = new Date(art.createdAt || now);
      const baseUpdated = new Date(art.updatedAt || now);

      // Past version points if versionHistory exists, or synthesize evolution points if version > 1
      const history = art.versionHistory && art.versionHistory.length > 0 
        ? art.versionHistory 
        : [];

      // If artifact has version > 1 but no explicit history list, synthesize realistic previous milestones
      const versionsToRender: { version: number; timestamp: Date; size: number; loc: number; summary: string }[] = [];

      if (history.length > 0) {
        history.forEach((h) => {
          versionsToRender.push({
            version: h.version,
            timestamp: new Date(h.timestamp),
            size: h.size,
            loc: h.loc || Math.max(10, Math.round(h.size / 30)),
            summary: h.summary,
          });
        });
      } else {
        // Synthesize past versions for rich evolution visualization
        for (let v = 1; v < art.version; v++) {
          const pastDate = new Date(baseCreated.getTime() + (v / art.version) * (baseUpdated.getTime() - baseCreated.getTime() - 86400000));
          const pastSize = Math.max(200, Math.round(art.content.length * (0.4 + (v / art.version) * 0.5)));
          versionsToRender.push({
            version: v,
            timestamp: pastDate,
            size: pastSize,
            loc: Math.max(10, Math.round(linesCount * (0.4 + (v / art.version) * 0.5))),
            summary: `v${v}.0 Baseline iteration & core functionality.`,
          });
        }
      }

      // Add prior version points
      let prevPtId: string | null = null;
      versionsToRender.forEach((vItem) => {
        const ptId = `pt-${art.id}-v${vItem.version}`;
        const pt: ScatterPoint = {
          id: ptId,
          artifactId: art.id,
          title: `${art.title} (v${vItem.version})`,
          version: vItem.version,
          type: art.type,
          language: art.language,
          workspaceId: art.workspaceId || 'ws-default',
          workspaceName: wsName,
          timestamp: vItem.timestamp,
          sizeBytes: vItem.size,
          loc: vItem.loc,
          summary: vItem.summary,
          isCurrentVersion: false,
          parentId: art.parentId,
          dependencies: art.dependencies || [],
          tags: art.tags || [],
          content: art.content,
          color: colors.fill,
          strokeColor: colors.stroke,
        };
        ptList.push(pt);

        // Evolution link from previous version
        if (prevPtId) {
          linkList.push({
            id: `evo-${prevPtId}-to-${ptId}`,
            sourceId: prevPtId,
            targetId: ptId,
            type: 'evolution',
            label: `v${vItem.version - 1} → v${vItem.version}`,
          });
        }
        prevPtId = ptId;
      });

      // Current version point
      const currentPtId = `pt-${art.id}-v${art.version}`;
      const currentPt: ScatterPoint = {
        id: currentPtId,
        artifactId: art.id,
        title: art.title,
        version: art.version,
        type: art.type,
        language: art.language,
        workspaceId: art.workspaceId || 'ws-default',
        workspaceName: wsName,
        timestamp: baseUpdated,
        sizeBytes: art.content.length,
        loc: linesCount,
        summary: art.description || `Current iteration release v${art.version}.0`,
        isCurrentVersion: true,
        parentId: art.parentId,
        dependencies: art.dependencies || [],
        tags: art.tags || [],
        content: art.content,
        color: colors.fill,
        strokeColor: colors.stroke,
      };
      ptList.push(currentPt);

      // Evolution link to current version
      if (prevPtId) {
        linkList.push({
          id: `evo-${prevPtId}-to-${currentPtId}`,
          sourceId: prevPtId,
          targetId: currentPtId,
          type: 'evolution',
          label: `v${art.version - 1} → v${art.version}`,
        });
      }
    });

    // Cross-file dependency links
    artifacts.forEach((art) => {
      const artPtId = `pt-${art.id}-v${art.version}`;
      
      // Explicit dependencies
      if (art.dependencies && art.dependencies.length > 0) {
        art.dependencies.forEach((depId) => {
          const targetArt = artifacts.find((a) => a.id === depId || a.title.toLowerCase() === depId.toLowerCase());
          if (targetArt) {
            const targetPtId = `pt-${targetArt.id}-v${targetArt.version}`;
            linkList.push({
              id: `dep-${art.id}-to-${targetArt.id}`,
              sourceId: targetPtId,
              targetId: artPtId,
              type: 'dependency',
              label: 'depends on',
            });
          }
        });
      }

      // Implicit derivation: if code or svg references markdown architecture
      if (art.type === 'code' || art.type === 'svg') {
        const archArt = artifacts.find((a) => a.type === 'markdown' && a.id !== art.id);
        if (archArt && !art.dependencies?.includes(archArt.id)) {
          linkList.push({
            id: `dep-${archArt.id}-to-${art.id}`,
            sourceId: `pt-${archArt.id}-v${archArt.version}`,
            targetId: artPtId,
            type: 'dependency',
            label: 'spec derivation',
          });
        }
      }
    });

    return { points: ptList, links: linkList };
  }, [artifacts, workspaceMap]);

  // Filtered Points based on Search & Type
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      const matchesType = typeFilter === 'ALL' || p.type.toUpperCase() === typeFilter.toUpperCase();
      const matchesSearch = !searchQuery.trim() || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.workspaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [points, typeFilter, searchQuery]);

  // Main D3 Scatter Plot Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 550;

    const margin = { top: 40, right: 40, bottom: 60, left: 65 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for gradients, glowing filters, and markers
    const defs = svg.append('defs');

    // Arrow marker for Evolution links
    defs
      .append('marker')
      .attr('id', 'evo-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#FAAD3F');

    // Arrow marker for Dependency links
    defs
      .append('marker')
      .attr('id', 'dep-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#38bdf8');

    // Radial glow filter for highlighted points
    const glow = defs.append('filter').attr('id', 'scatter-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Root clipping path
    defs
      .append('clipPath')
      .attr('id', 'scatter-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    // Root Group with Margins
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Time
    const timeExtent = d3.extent(points, (d: ScatterPoint) => d.timestamp);
    const minTime = timeExtent[0] instanceof Date 
      ? new Date(timeExtent[0].getTime() - 86400000 * 2) 
      : new Date(Date.now() - 86400000 * 7);
    const maxTime = timeExtent[1] instanceof Date 
      ? new Date(timeExtent[1].getTime() + 86400000 * 1) 
      : new Date(Date.now() + 86400000 * 1);

    const xScale = d3.scaleTime().domain([minTime, maxTime]).range([0, width]);

    // Y Scale: based on selected yMetric
    let yDomain: [number, number] = [0, 100];
    if (yMetric === 'size') {
      const maxBytes = d3.max(points, (d: ScatterPoint) => d.sizeBytes) || 4000;
      yDomain = [0, Math.ceil(Number(maxBytes) * 1.25)];
    } else if (yMetric === 'version') {
      const maxVer = d3.max(points, (d: ScatterPoint) => d.version) || 3;
      yDomain = [0.5, Number(maxVer) + 0.8];
    } else {
      const maxLoc = d3.max(points, (d: ScatterPoint) => d.loc) || 120;
      yDomain = [0, Math.ceil(Number(maxLoc) * 1.25)];
    }

    const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]).nice();

    // Axes
    const xAxis = d3.axisBottom<Date>(xScale).ticks(6).tickFormat(d3.timeFormat('%b %d') as any);
    const yAxis = d3.axisLeft<number>(yScale).ticks(6).tickFormat((d) => {
      if (yMetric === 'size') return `${Math.round(d / 1000)}k`;
      if (yMetric === 'version') return `v${d}`;
      return `${d} LOC`;
    });

    // Render Grid Lines
    const gridGroup = g.append('g').attr('class', 'grid-lines');
    gridGroup
      .append('g')
      .attr('class', 'grid-x')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-height)
          .tickFormat(() => '')
      )
      .attr('stroke', 'rgba(255,255,255,0.04)');

    gridGroup
      .append('g')
      .attr('class', 'grid-y')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .attr('stroke', 'rgba(255,255,255,0.04)');

    // Axes Containers
    const gX = g.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${height})`).call(xAxis);
    const gY = g.append('g').attr('class', 'axis axis-y').call(yAxis);

    // Style Axes Lines & Text
    g.selectAll('.axis text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    g.selectAll('.axis line, .axis path').attr('stroke', 'rgba(255,255,255,0.15)');

    // Axis Titles
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text('Evolution Timeline (Chronological Creation & Revisions)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -48)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text(
        yMetric === 'size'
          ? 'Artifact Size / Payload (Bytes)'
          : yMetric === 'version'
          ? 'Version Iteration Level'
          : 'Lines of Code (LOC)'
      );

    // Zoomable Content Group with Clipping
    const contentGroup = g.append('g').attr('class', 'scatter-content').attr('clip-path', 'url(#scatter-clip)');

    // Map point positions based on scales
    points.forEach((p) => {
      p.x = xScale(p.timestamp);
      const yVal = yMetric === 'size' ? p.sizeBytes : yMetric === 'version' ? p.version : p.loc;
      p.y = yScale(yVal);
    });

    const pointMap = new Map<string, ScatterPoint>();
    points.forEach((p) => pointMap.set(p.id, p));

    // Resolve links
    links.forEach((l) => {
      l.sourcePoint = pointMap.get(l.sourceId);
      l.targetPoint = pointMap.get(l.targetId);
    });

    // Render Evolution Lines
    const evoLinkGroup = contentGroup.append('g').attr('class', 'evolution-links');
    if (showEvolutionLines) {
      evoLinkGroup
        .selectAll('path.evo-line')
        .data(links.filter((l) => l.type === 'evolution' && l.sourcePoint && l.targetPoint))
        .enter()
        .append('path')
        .attr('class', 'evo-line')
        .attr('fill', 'none')
        .attr('stroke', '#FAAD3F')
        .attr('stroke-width', 2.2)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-dasharray', '4,3')
        .attr('marker-end', 'url(#evo-arrow)')
        .attr('d', (d: any) => {
          const s = (d as ScatterLink).sourcePoint!;
          const t = (d as ScatterLink).targetPoint!;
          const dx = (t.x || 0) - (s.x || 0);
          const dy = (t.y || 0) - (s.y || 0);
          const cx1 = (s.x || 0) + dx * 0.5;
          const cy1 = s.y || 0;
          const cx2 = (s.x || 0) + dx * 0.5;
          const cy2 = t.y || 0;
          return `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
        });
    }

    // Render Dependency Links
    const depLinkGroup = contentGroup.append('g').attr('class', 'dependency-links');
    if (showDependencyLines) {
      depLinkGroup
        .selectAll('path.dep-line')
        .data(links.filter((l) => l.type === 'dependency' && l.sourcePoint && l.targetPoint))
        .enter()
        .append('path')
        .attr('class', 'dep-line')
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.8)
        .attr('stroke-opacity', 0.45)
        .attr('stroke-dasharray', '6,4')
        .attr('marker-end', 'url(#dep-arrow)')
        .attr('d', (d: any) => {
          const s = (d as ScatterLink).sourcePoint!;
          const t = (d as ScatterLink).targetPoint!;
          const dx = (t.x || 0) - (s.x || 0);
          const dy = (t.y || 0) - (s.y || 0);
          const cx1 = (s.x || 0) + dx * 0.4;
          const cy1 = (s.y || 0) - 25;
          const cx2 = (t.x || 0) - dx * 0.4;
          const cy2 = (t.y || 0) - 25;
          return `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
        });
    }

    // Render Scatter Points
    const pointsGroup = contentGroup.append('g').attr('class', 'points');
    const pointSelection = pointsGroup
      .selectAll('g.scatter-point')
      .data(filteredPoints)
      .enter()
      .append('g')
      .attr('class', 'scatter-point cursor-pointer')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    // Outer Selection Halo
    pointSelection
      .append('circle')
      .attr('r', (d: any) => (d.artifactId === activeArtifactId ? 18 : 12))
      .attr('fill', 'none')
      .attr('stroke', (d: any) => (d.artifactId === activeArtifactId ? '#FAAD3F' : 'transparent'))
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '3,3')
      .attr('class', 'halo');

    // Main Scatter Circle
    pointSelection
      .append('circle')
      .attr('r', (d: any) => (d.isCurrentVersion ? 10 : 7))
      .attr('fill', (d: any) => d.color)
      .attr('stroke', (d: any) => d.strokeColor)
      .attr('stroke-width', (d: any) => (d.isCurrentVersion ? 2.5 : 1.5))
      .attr('filter', (d: any) => (d.artifactId === activeArtifactId ? 'url(#scatter-glow)' : 'none'))
      .attr('fill-opacity', (d: any) => (d.isCurrentVersion ? 0.9 : 0.65));

    // Version Text inside/beside circle
    pointSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text((d: any) => `v${d.version}`);

    // Artifact Title Label
    pointSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18)
      .attr('font-size', '9px')
      .attr('font-family', 'sans-serif')
      .attr('fill', (d: any) => (d.isCurrentVersion ? '#f1f5f9' : '#94a3b8'))
      .attr('stroke', '#000000')
      .attr('stroke-width', '2px')
      .attr('paint-order', 'stroke fill')
      .attr('pointer-events', 'none')
      .text((d: any) => (d.title && d.title.length > 14 ? `${d.title.slice(0, 14)}...` : d.title || ''));

    // Point Interactions (Click & Hover)
    pointSelection
      .on('click', (event, d: any) => {
        event.stopPropagation();
        triggerHaptic(15);
        const pt = d as ScatterPoint;
        setSelectedPoint(pt);
        onSelectArtifact(pt.artifactId);
      })
      .on('mouseenter', (event, d: any) => {
        const pt = d as ScatterPoint;
        setHoveredPoint(pt);

        // Highlight connected evolution and dependency lines
        d3.selectAll('.evo-line')
          .attr('stroke-opacity', (l: any) =>
            l.sourceId === pt.id || l.targetId === pt.id ? 1 : 0.1
          )
          .attr('stroke-width', (l: any) =>
            l.sourceId === pt.id || l.targetId === pt.id ? 3.5 : 1
          );

        d3.selectAll('.dep-line')
          .attr('stroke-opacity', (l: any) =>
            l.sourceId === pt.id || l.targetId === pt.id ? 1 : 0.1
          )
          .attr('stroke-width', (l: any) =>
            l.sourceId === pt.id || l.targetId === pt.id ? 3 : 1
          );

        pointSelection.attr('opacity', (p: any) => (p.artifactId === pt.artifactId ? 1 : 0.3));
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
        d3.selectAll('.evo-line').attr('stroke-opacity', 0.6).attr('stroke-width', 2.2);
        d3.selectAll('.dep-line').attr('stroke-opacity', 0.45).attr('stroke-width', 1.8);
        pointSelection.attr('opacity', 1);
      });

    // Zoom & Pan Handler
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);

        // Update Axes
        gX.call(d3.axisBottom(newXScale).ticks(6).tickFormat(d3.timeFormat('%b %d') as any));
        gY.call(
          d3.axisLeft(newYScale).ticks(6).tickFormat((d: any) => {
            if (yMetric === 'size') return `${Math.round(d / 1000)}k`;
            if (yMetric === 'version') return `v${d}`;
            return `${d} LOC`;
          })
        );

        g.selectAll('.axis text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
        g.selectAll('.axis line, .axis path').attr('stroke', 'rgba(255,255,255,0.15)');

        // Update Points Position
        pointSelection.attr('transform', (d: any) => {
          const pt = d as ScatterPoint;
          const yVal = yMetric === 'size' ? pt.sizeBytes : yMetric === 'version' ? pt.version : pt.loc;
          return `translate(${newXScale(pt.timestamp)},${newYScale(yVal)})`;
        });

        // Update Evolution Lines
        evoLinkGroup.selectAll('path.evo-line').attr('d', (d: any) => {
          const s = d.sourcePoint!;
          const t = d.targetPoint!;
          const sx = newXScale(s.timestamp);
          const sy = newYScale(yMetric === 'size' ? s.sizeBytes : yMetric === 'version' ? s.version : s.loc);
          const tx = newXScale(t.timestamp);
          const ty = newYScale(yMetric === 'size' ? t.sizeBytes : yMetric === 'version' ? t.version : t.loc);
          const dx = tx - sx;
          return `M ${sx} ${sy} C ${sx + dx * 0.5} ${sy}, ${sx + dx * 0.5} ${ty}, ${tx} ${ty}`;
        });

        // Update Dependency Lines
        depLinkGroup.selectAll('path.dep-line').attr('d', (d: any) => {
          const s = d.sourcePoint!;
          const t = d.targetPoint!;
          const sx = newXScale(s.timestamp);
          const sy = newYScale(yMetric === 'size' ? s.sizeBytes : yMetric === 'version' ? s.version : s.loc);
          const tx = newXScale(t.timestamp);
          const ty = newYScale(yMetric === 'size' ? t.sizeBytes : yMetric === 'version' ? t.version : t.loc);
          const dx = tx - sx;
          return `M ${sx} ${sy} C ${sx + dx * 0.4} ${sy - 25}, ${tx - dx * 0.4} ${ty - 25}, ${tx} ${ty}`;
        });
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
      svg.selectAll('*').remove();
    };
  }, [filteredPoints, points, links, yMetric, showEvolutionLines, showDependencyLines, activeArtifactId]);

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

  // Create New Version Handler
  const handleCreateNewVersion = () => {
    if (!selectedPoint) return;
    const currentArt = artifacts.find((a) => a.id === selectedPoint.artifactId);
    if (!currentArt || !onSaveArtifact) return;

    triggerHaptic(20);
    const newVerNumber = currentArt.version + 1;
    const newRecord: ArtifactVersionRecord = {
      version: currentArt.version,
      timestamp: currentArt.updatedAt || new Date().toISOString(),
      summary: versionSummary.trim() || `Iterative evolution release v${currentArt.version}.0`,
      size: currentArt.content.length,
      loc: currentArt.content.split('\n').length,
    };

    const nextHistory = currentArt.versionHistory ? [...currentArt.versionHistory, newRecord] : [newRecord];

    onSaveArtifact({
      ...currentArt,
      version: newVerNumber,
      updatedAt: new Date().toISOString(),
      versionHistory: nextHistory,
    });

    setShowNewVersionModal(false);
    setVersionSummary('');
  };

  // Find artifact object if an artifact node is selected
  const selectedArtifact = useMemo(() => {
    if (selectedPoint?.artifactId) {
      return artifacts.find((a) => a.id === selectedPoint.artifactId) || null;
    }
    return null;
  }, [selectedPoint, artifacts]);

  // Dependent files for selected artifact
  const dependentArtifacts = useMemo(() => {
    if (!selectedArtifact) return [];
    return artifacts.filter((a) => a.dependencies?.includes(selectedArtifact.id));
  }, [selectedArtifact, artifacts]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-hidden select-none" ref={containerRef}>
      
      {/* Top HUD Filter & Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-[#090f1e]/90 backdrop-blur-md z-10 flex-shrink-0">
        
        {/* Title and stats */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 shadow-sm">
            <TrendingUp size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Artifact Evolution Scatter Matrix
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAAD3F]/20 text-[#FAAD3F] border border-[#FAAD3F]/40 font-bold">
                D3 Interactive Plot
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Mapping chronological version iterations, code complexity curves, and file dependency graphs.
            </p>
          </div>
        </div>

        {/* Controls: Y-Axis Metric, Links Toggle, Zoom HUD */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Y-Axis Metric Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/50 border border-white/10">
            {(['size', 'version', 'lines'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  triggerHaptic(10);
                  setYMetric(m);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  yMetric === m
                    ? 'bg-[#FAAD3F] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'size' ? 'File Size' : m === 'version' ? 'Version' : 'LOC'}
              </button>
            ))}
          </div>

          {/* Links Toggles */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-[10px] font-mono">
            <button
              onClick={() => setShowEvolutionLines(!showEvolutionLines)}
              className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
                showEvolutionLines ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FAAD3F]" />
              <span>Evolution Paths</span>
            </button>
            <button
              onClick={() => setShowDependencyLines(!showDependencyLines)}
              className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
                showDependencyLines ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              <span>Dependencies</span>
            </button>
          </div>

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
              title="Reset View"
            >
              <RotateCcw size={13} />
            </button>
          </div>

        </div>
      </div>

      {/* Main SVG Scatter Plot Canvas */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Legend Overlay at bottom left */}
        <div className="absolute bottom-3 left-3 z-10 p-3 rounded-2xl bg-[#090f1e]/90 border border-white/10 backdrop-blur-md shadow-xl text-[10px] font-mono space-y-1.5 pointer-events-auto hidden md:block">
          <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px] mb-1">
            Evolution & Dependency Key
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FAAD3F] border border-amber-300" />
            <span className="text-slate-300">Current Release (v{selectedArtifact?.version || 'N'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500 opacity-60" />
            <span className="text-slate-400">Historical Iteration</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-slate-400 text-[9px]">
            <span className="w-3 border-t-2 border-dashed border-[#FAAD3F] inline-block" />
            <span className="text-amber-300">Version Lineage (v1 → v2)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[9px]">
            <span className="w-3 border-t-2 border-dashed border-[#38bdf8] inline-block" />
            <span className="text-sky-300">Cross-File Dependency</span>
          </div>
        </div>

        {/* Hover Tooltip Overlay */}
        <AnimatePresence>
          {hoveredPoint && !selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-[#0b1222]/95 border border-[#FAAD3F]/40 shadow-2xl backdrop-blur-md text-white text-xs font-mono max-w-xs pointer-events-none"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-white truncate">{hoveredPoint.title}</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[#FAAD3F] font-bold text-[9px]">
                  v{hoveredPoint.version}.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                {hoveredPoint.summary}
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-300 border-t border-white/10 pt-1.5">
                <div>Size: <span className="text-white font-bold">{hoveredPoint.sizeBytes} B</span></div>
                <div>Lines: <span className="text-white font-bold">{hoveredPoint.loc} LOC</span></div>
                <div>Date: <span className="text-white font-bold">{hoveredPoint.timestamp.toLocaleDateString()}</span></div>
                <div>Project: <span className="text-[#FAAD3F] font-bold truncate">{hoveredPoint.workspaceName}</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Point Evolution Drawer on Right */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="absolute top-3 right-3 bottom-3 w-84 max-w-[92vw] z-30 p-4 rounded-2xl bg-[#0b1222]/95 border border-[#FAAD3F]/40 shadow-2xl backdrop-blur-xl text-white flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: selectedPoint.strokeColor }} 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 block">
                          Artifact Evolution Point
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-bold text-[9px]">
                          v{selectedPoint.version}.0
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        {selectedPoint.title}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Payload Size</span>
                    <span className="font-bold text-white">{selectedPoint.sizeBytes} B</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Lines of Code</span>
                    <span className="font-bold text-white">{selectedPoint.loc} LOC</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Workspace</span>
                    <span className="font-bold text-[#FAAD3F] truncate block">{selectedPoint.workspaceName}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Revision Date</span>
                    <span className="font-bold text-white">{selectedPoint.timestamp.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Evolution Summary / Milestone Note */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs font-mono">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Clock size={11} /> Milestone Summary
                  </span>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                    {selectedPoint.summary || 'Production iteration release.'}
                  </p>
                </div>

                {/* Cross-File Dependencies List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <GitBranch size={11} /> File Dependencies ({selectedPoint.dependencies.length})
                  </span>
                  {selectedPoint.dependencies.length > 0 ? (
                    <div className="space-y-1">
                      {selectedPoint.dependencies.map((dep, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono text-sky-300 flex items-center gap-1.5"
                        >
                          <ArrowRight size={10} className="text-sky-400 flex-shrink-0" />
                          <span className="truncate">{dep}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No external file dependencies detected.</p>
                  )}
                </div>

                {/* Dependent Files that reference this */}
                {dependentArtifacts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                      <Layers size={11} /> Depended on by ({dependentArtifacts.length} files)
                    </span>
                    <div className="space-y-1">
                      {dependentArtifacts.map((depArt) => (
                        <div
                          key={depArt.id}
                          onClick={() => {
                            triggerHaptic(15);
                            onSelectArtifact(depArt.id);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-200 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="truncate">{depArt.title}</span>
                          <span className="text-[9px] text-amber-300">v{depArt.version}.0</span>
                        </div>
                      ))}
                    </div>
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

                  {/* Iterate New Version Button */}
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      setShowNewVersionModal(true);
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Iterate New Version (v{selectedArtifact.version + 1}.0)</span>
                  </button>

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

        {/* Modal: Iterate New Version */}
        <AnimatePresence>
          {showNewVersionModal && selectedArtifact && (
            <div 
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowNewVersionModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md p-5 rounded-3xl bg-[#0d1424] border border-[#FAAD3F]/40 shadow-2xl space-y-4 text-white"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                      Evolutionary Version Commit
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Bump to v{selectedArtifact.version + 1}.0: {selectedArtifact.title}
                    </h3>
                  </div>
                  <button onClick={() => setShowNewVersionModal(false)} className="text-slate-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <label className="text-slate-300 block">Milestone / Revision Summary:</label>
                  <textarea
                    value={versionSummary}
                    onChange={(e) => setVersionSummary(e.target.value)}
                    placeholder={`e.g. Optimized D3 render loop, added dependency linkage, fixed memory ceiling...`}
                    className="w-full h-24 p-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#FAAD3F] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowNewVersionModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNewVersion}
                    className="px-4 py-1.5 rounded-xl bg-[#FAAD3F] text-black font-mono font-bold text-xs shadow-md hover:brightness-110"
                  >
                    Commit Version v{selectedArtifact.version + 1}.0
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
