import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Bookmark, Collection, GraphNode, GraphLink } from '../types';
import { extractDomain } from '../lib/utils';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ExternalLink, 
  Tag as TagIcon, 
  Layers, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

interface VisualMapProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  searchQuery: string;
  selectedCollectionId: string | null;
  selectedTag: string | null;
  onSelectBookmark?: (bookmark: Bookmark) => void;
  onEditBookmark?: (bookmark: Bookmark) => void;
  isDarkMode?: boolean;
}

export const VisualMap: React.FC<VisualMapProps> = ({
  bookmarks,
  collections,
  searchQuery,
  selectedCollectionId,
  selectedTag,
  onSelectBookmark,
  onEditBookmark,
  isDarkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Expanded collections set for progressive disclosure
  const [expandedCollectionIds, setExpandedCollectionIds] = useState<Set<string>>(() => {
    // By default expand top collections so graph is immediately enticing
    return new Set(collections.map(c => c.id));
  });

  // Track hover preview state
  const [hoveredNode, setHoveredNode] = useState<{
    node: GraphNode;
    x: number;
    y: number;
  } | null>(null);

  // Selected node state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Zoom transform ref for zoom controls
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Collections lookup
  const collectionMap = useMemo(() => {
    return new Map<string, Collection>(collections.map(c => [c.id, c]));
  }, [collections]);

  // When search query is active, auto-expand parent collections of matching bookmarks
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const matchingBookmarks = bookmarks.filter(b => 
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query) ||
      b.notes?.toLowerCase().includes(query) ||
      b.tags.some(t => t.toLowerCase().includes(query))
    );

    const neededCollections = new Set(expandedCollectionIds);
    matchingBookmarks.forEach(bm => {
      bm.collectionIds.forEach(cid => {
        neededCollections.add(cid);
        // also add parent collection if subcollection
        const col = collectionMap.get(cid);
        if (col?.parentCollectionId) {
          neededCollections.add(col.parentCollectionId);
        }
      });
    });
    setExpandedCollectionIds(neededCollections);
  }, [searchQuery, bookmarks, collectionMap]);

  // If a specific collection is selected in sidebar, make sure it is expanded
  useEffect(() => {
    if (selectedCollectionId && selectedCollectionId !== 'inbox') {
      setExpandedCollectionIds(prev => new Set(prev).add(selectedCollectionId));
    }
  }, [selectedCollectionId]);

  // Build Graph Nodes and Links based on progressive disclosure
  const { nodes, links, matchingNodeIds } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawLinks: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = (b: Bookmark) => {
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    };

    const matchesTag = (b: Bookmark) => {
      if (!selectedTag) return true;
      return b.tags.includes(selectedTag);
    };

    const matchingIds = new Set<string>();

    // 1. Separate root collections vs subcollections
    const rootCollections = collections.filter(c => !c.parentCollectionId);
    const subCollections = collections.filter(c => !!c.parentCollectionId);

    // Count bookmarks per collection
    const bookmarkCountByCol = new Map<string, number>();
    bookmarks.forEach(bm => {
      if (bm.collectionIds && bm.collectionIds.length > 0) {
        bm.collectionIds.forEach(cid => {
          bookmarkCountByCol.set(cid, (bookmarkCountByCol.get(cid) || 0) + 1);
        });
      } else {
        bookmarkCountByCol.set('col-inbox', (bookmarkCountByCol.get('col-inbox') || 0) + 1);
      }
    });

    // Add Root Collections
    rootCollections.forEach(c => {
      const isExpanded = expandedCollectionIds.has(c.id);
      const node: GraphNode = {
        id: c.id,
        title: c.name,
        type: 'collection',
        data: c,
        expanded: isExpanded,
        color: c.color || '#6366f1',
        radius: 28,
        childCount: bookmarkCountByCol.get(c.id) || 0,
      };
      rawNodes.push(node);
      nodeMap.set(c.id, node);
    });

    // Add Inbox Collection node if there are unclassified bookmarks
    const inboxCount = bookmarkCountByCol.get('col-inbox') || 0;
    if (inboxCount > 0) {
      const inboxNode: GraphNode = {
        id: 'col-inbox',
        title: 'Inbox',
        type: 'collection',
        data: {
          id: 'col-inbox',
          name: 'Inbox',
          color: '#94a3b8',
          createdAt: 0,
        },
        expanded: expandedCollectionIds.has('col-inbox'),
        color: '#94a3b8',
        radius: 24,
        childCount: inboxCount,
      };
      rawNodes.push(inboxNode);
      nodeMap.set('col-inbox', inboxNode);
    }

    // Add Subcollections (visible if their parent collection is expanded)
    subCollections.forEach(sc => {
      const parentIsExpanded = expandedCollectionIds.has(sc.parentCollectionId!);
      if (parentIsExpanded) {
        const isExpanded = expandedCollectionIds.has(sc.id);
        const node: GraphNode = {
          id: sc.id,
          title: sc.name,
          type: 'subcollection',
          data: sc,
          expanded: isExpanded,
          color: sc.color || nodeMap.get(sc.parentCollectionId!)?.color || '#3b82f6',
          radius: 22,
          parentId: sc.parentCollectionId,
          childCount: bookmarkCountByCol.get(sc.id) || 0,
        };
        rawNodes.push(node);
        nodeMap.set(sc.id, node);

        rawLinks.push({
          id: `${sc.parentCollectionId}-${sc.id}`,
          source: sc.parentCollectionId!,
          target: sc.id,
        });
      }
    });

    // Add Bookmarks
    bookmarks.forEach(bm => {
      const isMatch = matchesQuery(bm) && matchesTag(bm);
      if (isMatch && q) {
        matchingIds.add(`bm-${bm.id}`);
      }

      // Check if this bookmark should be rendered
      // A bookmark is rendered if any of its parent collections (or Inbox) is currently expanded
      let isVisible = false;
      const connectedParentIds: string[] = [];

      if (!bm.collectionIds || bm.collectionIds.length === 0) {
        if (expandedCollectionIds.has('col-inbox')) {
          isVisible = true;
          connectedParentIds.push('col-inbox');
        }
      } else {
        bm.collectionIds.forEach(cid => {
          if (nodeMap.has(cid) && expandedCollectionIds.has(cid)) {
            isVisible = true;
            connectedParentIds.push(cid);
          }
        });
      }

      // If search query is active and matches, force visible
      if (q && isMatch) {
        isVisible = true;
      }

      if (isVisible) {
        const bmNodeId = `bm-${bm.id}`;
        if (!nodeMap.has(bmNodeId)) {
          const firstParent = connectedParentIds[0] ? nodeMap.get(connectedParentIds[0]) : null;
          const node: GraphNode = {
            id: bmNodeId,
            title: bm.title || extractDomain(bm.url),
            type: 'bookmark',
            data: bm,
            color: firstParent?.color || '#38bdf8',
            radius: 14,
            parentId: connectedParentIds[0] || null,
          };
          rawNodes.push(node);
          nodeMap.set(bmNodeId, node);
        }

        connectedParentIds.forEach(pid => {
          if (nodeMap.has(pid)) {
            rawLinks.push({
              id: `${pid}-${bmNodeId}`,
              source: pid,
              target: bmNodeId,
            });
          }
        });
      }
    });

    return { nodes: rawNodes, links: rawLinks, matchingNodeIds: matchingIds };
  }, [bookmarks, collections, expandedCollectionIds, searchQuery, selectedTag]);

  // Main D3 Force Simulation Setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions for gradients & glowing drop shadows
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle star background grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'star-grid')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle')
      .attr('cx', 20)
      .attr('cy', 20)
      .attr('r', 1)
      .attr('fill', isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');

    // Canvas background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#star-grid)')
      .on('click', () => {
        setSelectedNodeId(null);
        setHoveredNode(null);
      });

    // Main transform group
    const g = svg.append('g').attr('class', 'main-layer');

    // D3 Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Links Layer
    const linkGroup = g.append('g').attr('class', 'links-layer');
    // Nodes Layer
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');

    // Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => {
        const targetType = (d.target as GraphNode).type;
        if (targetType === 'subcollection') return 110;
        if (targetType === 'bookmark') return 80;
        return 140;
      }).strength(0.6))
      .force('charge', d3.forceManyBody().strength(d => {
        const node = d as GraphNode;
        if (node.type === 'collection') return -500;
        if (node.type === 'subcollection') return -300;
        return -140;
      }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius(d => (d.radius || 20) + 18).iterations(2));

    // Draw Links
    const linkElements = linkGroup.selectAll<SVGLineElement, GraphLink>('line')
      .data(links, d => d.id)
      .join('line')
      .attr('stroke', isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.25)')
      .attr('stroke-width', d => {
        const targetType = (d.target as GraphNode).type;
        return targetType === 'bookmark' ? 1.5 : 2.5;
      })
      .attr('stroke-dasharray', d => {
        const targetType = (d.target as GraphNode).type;
        return targetType === 'bookmark' ? '3 3' : 'none';
      });

    // Drag behavior
    const dragBehavior = d3.drag<SVGGElement, GraphNode>()
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

    // Draw Nodes
    const nodeElements = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
      .data(nodes, d => d.id)
      .join('g')
      .attr('class', 'node cursor-pointer select-none')
      .call(dragBehavior);

    // Render outer rings / halos for collections
    nodeElements.each(function(d) {
      const el = d3.select(this);

      // Pulse ring for collections or search matches
      const isSearchMatch = matchingNodeIds.has(d.id);
      
      if (d.type === 'collection' || d.type === 'subcollection') {
        el.append('circle')
          .attr('class', 'outer-pulse')
          .attr('r', (d.radius || 20) + 6)
          .attr('fill', 'none')
          .attr('stroke', d.color || '#6366f1')
          .attr('stroke-opacity', d.expanded ? 0.35 : 0.15)
          .attr('stroke-width', 2);
      }

      // Base Circle
      const circle = el.append('circle')
        .attr('class', 'main-circle')
        .attr('r', d.radius || 18)
        .attr('fill', () => {
          if (d.type === 'bookmark') {
            return isDarkMode ? '#1e293b' : '#ffffff';
          }
          return d.color || '#6366f1';
        })
        .attr('stroke', () => {
          if (isSearchMatch) return '#38bdf8';
          if (d.type === 'bookmark') return d.color || '#94a3b8';
          return isDarkMode ? '#ffffff' : '#0f172a';
        })
        .attr('stroke-width', isSearchMatch ? 3 : (d.type === 'bookmark' ? 2 : 2.5))
        .attr('filter', isSearchMatch ? 'url(#glow)' : 'none');

      // Bookmark Favicon inside circle
      if (d.type === 'bookmark') {
        const bm = d.data as Bookmark;
        const iconSize = 16;
        el.append('image')
          .attr('href', bm.favicon || `https://www.google.com/s2/favicons?domain=${extractDomain(bm.url)}&sz=64`)
          .attr('x', -iconSize / 2)
          .attr('y', -iconSize / 2)
          .attr('width', iconSize)
          .attr('height', iconSize)
          .attr('clip-path', 'circle(8px at center)');
      } else {
        // Collection icon indicator (+ / - or count)
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#ffffff')
          .attr('font-size', d.type === 'collection' ? '12px' : '10px')
          .attr('font-weight', '700')
          .text(d.expanded ? '−' : '+');
      }

      // Label below or next to node
      const label = el.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', (d.radius || 18) + 14)
        .attr('font-size', d.type === 'collection' ? '12px' : (d.type === 'subcollection' ? '11px' : '10px'))
        .attr('font-weight', d.type === 'collection' ? '600' : '500')
        .attr('fill', () => {
          if (isSearchMatch) return '#38bdf8';
          return isDarkMode ? '#e2e8f0' : '#1e293b';
        })
        .text(() => {
          const title = d.title || '';
          return title.length > 20 ? title.substring(0, 18) + '…' : title;
        });

      // Child count badge for collections
      if ((d.type === 'collection' || d.type === 'subcollection') && (d.childCount || 0) > 0) {
        const badgeGroup = el.append('g')
          .attr('transform', `translate(${(d.radius || 20) - 2}, ${-(d.radius || 20) + 4})`);
        
        badgeGroup.append('circle')
          .attr('r', 8)
          .attr('fill', isDarkMode ? '#0f172a' : '#ffffff')
          .attr('stroke', d.color || '#6366f1')
          .attr('stroke-width', 1.5);

        badgeGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '3px')
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('fill', d.color || '#6366f1')
          .text(d.childCount || 0);
      }
    });

    // Search query fading: if search is active, fade non-matching nodes
    if (searchQuery.trim()) {
      const activeSearch = searchQuery.toLowerCase().trim();
      nodeElements.style('opacity', d => {
        if (matchingNodeIds.has(d.id)) return 1;
        // Keep parent collections visible
        if (d.type === 'collection' || d.type === 'subcollection') return 0.85;
        return 0.2;
      });
      linkElements.style('opacity', 0.2);
    } else {
      nodeElements.style('opacity', 1);
      linkElements.style('opacity', 1);
    }

    // Node Interactions
    nodeElements
      .on('mouseenter', (event, d) => {
        // Highlighting connected links and neighbors
        const connectedIds = new Set<string>([d.id]);
        links.forEach(l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sId === d.id) connectedIds.add(tId);
          if (tId === d.id) connectedIds.add(sId);
        });

        nodeElements.style('opacity', n => connectedIds.has(n.id) ? 1 : 0.3);
        linkElements.style('stroke', l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sId === d.id || tId === d.id) ? (d.color || '#38bdf8') : (isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)');
        }).style('stroke-width', l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sId === d.id || tId === d.id) ? 2.5 : 1;
        });

        // If bookmark node, trigger rich preview card
        if (d.type === 'bookmark') {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoveredNode({
              node: d,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        }
      })
      .on('mouseleave', () => {
        // Restore opacity
        if (!searchQuery.trim()) {
          nodeElements.style('opacity', 1);
          linkElements
            .style('stroke', isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.25)')
            .style('stroke-width', d => (d.target as GraphNode).type === 'bookmark' ? 1.5 : 2.5);
        } else {
          nodeElements.style('opacity', d => matchingNodeIds.has(d.id) ? 1 : 0.2);
        }
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);

        if (d.type === 'collection' || d.type === 'subcollection') {
          // Progressive disclosure: toggle expansion
          setExpandedCollectionIds(prev => {
            const next = new Set(prev);
            if (next.has(d.id)) {
              next.delete(d.id);
            } else {
              next.add(d.id);
            }
            return next;
          });
        } else if (d.type === 'bookmark') {
          const bm = d.data as Bookmark;
          if (onSelectBookmark) {
            onSelectBookmark(bm);
          } else {
            // Default click: open link in new tab safely
            window.open(bm.url, '_blank', 'noopener,noreferrer');
          }
        }
      });

    // Simulation Tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      nodeElements.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, matchingNodeIds, isDarkMode, searchQuery]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 0.75);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const handleFitView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current || nodes.length === 0) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      }
    });

    if (minX === Infinity) return;

    const dx = maxX - minX || 100;
    const dy = maxY - minY || 100;
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;
    const scale = Math.max(0.3, Math.min(2.5, 0.8 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-950 select-none flex flex-col"
    >
      {/* Interactive Map Header Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-full px-3 py-1.5 shadow-lg text-xs text-slate-300">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Interactive Constellation</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Click collection to expand/collapse</span>
      </div>

      {/* Floating Zoom & Canvas Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col space-y-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          title="Fit to Screen"
          aria-label="Fit map to screen"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          aria-label="Reset zoom"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Guide / Quick Stats */}
      <div className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-4 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white/40" />
          <span>Collection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white/40" />
          <span>Subcollection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-200 border border-sky-400" />
          <span>Bookmark ({bookmarks.length})</span>
        </div>
      </div>

      {/* SVG Canvas for D3 visualization */}
      <svg 
        ref={svgRef} 
        className="w-full h-full flex-1 touch-none"
      />

      {/* Bookmark Hover Preview Card (Fixed Anchor to prevent clipping) */}
      {hoveredNode && hoveredNode.node.type === 'bookmark' && (
        <div 
          className="absolute z-30 pointer-events-auto transition-opacity duration-150"
          style={{
            left: Math.min(hoveredNode.x + 16, (containerRef.current?.clientWidth || 800) - 320),
            top: Math.max(16, Math.min(hoveredNode.y - 40, (containerRef.current?.clientHeight || 600) - 240)),
          }}
          onMouseEnter={() => {}}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {(() => {
            const bm = hoveredNode.node.data as Bookmark;
            const domain = extractDomain(bm.url);
            const parentCollections = bm.collectionIds
              .map(id => collectionMap.get(id)?.name)
              .filter(Boolean);

            return (
              <div className="w-76 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-4 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Header with favicon, domain, and open button */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img 
                      src={bm.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                      alt="" 
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xs font-mono text-indigo-400 truncate">
                      {domain}
                    </span>
                  </div>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Bookmark Title */}
                <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5">
                  {bm.title || domain}
                </h4>

                {/* Description */}
                {bm.description && (
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                    {bm.description}
                  </p>
                )}

                {/* Collections & Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                  {parentCollections.length > 0 ? (
                    parentCollections.map((name, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      >
                        <Layers className="w-2.5 h-2.5" />
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                      Inbox
                    </span>
                  )}

                  {bm.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Edit Action Shortcut */}
                {onEditBookmark && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoveredNode(null);
                        onEditBookmark(bm);
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Edit details →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
