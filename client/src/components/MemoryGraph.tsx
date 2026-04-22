import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { Layers, Shuffle } from "lucide-react";

type MemoryNode = {
  id: number;
  content: string;
  category: string;
  importance: number;
  tags: string[];
  sentinelId: number;
  createdAt: Date | string | null;
};

type MemoryEdge = {
  source: number;
  target: number;
  weight: number;
  sharedTags?: string[];
};

type GraphData = {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
};

type Props = {
  data: GraphData;
  onNodeClick?: (node: MemoryNode) => void;
};

// Category colour map
const CATEGORY_COLORS: Record<string, string> = {
  insight: "#22d3ee",      // cyan
  decision: "#a78bfa",     // violet
  milestone: "#fbbf24",    // amber
  preference: "#34d399",   // emerald
  goal: "#f472b6",         // pink
  achievement: "#fb923c",  // orange
  challenge: "#f87171",    // red
  pattern: "#60a5fa",      // blue
};

const DEFAULT_COLOR = "#94a3b8";

// Cluster grid positions — maps each category to a (cx, cy) fraction of the canvas
// arranged in a 3×3 grid so clusters don't overlap
const CLUSTER_POSITIONS: Record<string, [number, number]> = {
  insight:     [0.20, 0.20],
  decision:    [0.50, 0.15],
  milestone:   [0.80, 0.20],
  preference:  [0.15, 0.50],
  goal:        [0.50, 0.50],
  achievement: [0.85, 0.50],
  challenge:   [0.20, 0.80],
  pattern:     [0.50, 0.82],
};

type NodeTooltip = { x: number; y: number; node: MemoryNode };
type EdgeTooltip = { x: number; y: number; sharedTags: string[]; weight: number };

export type LayoutMode = "free" | "cluster";

export default function MemoryGraph({ data, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [nodeTooltip, setNodeTooltip] = useState<NodeTooltip | null>(null);
  const [edgeTooltip, setEdgeTooltip] = useState<EdgeTooltip | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("free");

  // Rebuild the simulation whenever data or layout mode changes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Zoom/pan behaviour
    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    // ── Types ──
    type SimNode = MemoryNode & d3.SimulationNodeDatum;
    type SimLink = d3.SimulationLinkDatum<SimNode> & { weight: number; sharedTags: string[] };

    const nodeById = new Map<number, SimNode>();
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const sn = { ...n } as SimNode;
      nodeById.set(n.id, sn);
      return sn;
    });

    const simLinks: SimLink[] = data.edges
      .map((e) => {
        const source = nodeById.get(e.source);
        const target = nodeById.get(e.target);
        if (!source || !target) return null;
        return { source, target, weight: e.weight, sharedTags: e.sharedTags ?? [] } as SimLink;
      })
      .filter((l): l is SimLink => l !== null);

    // ── Cluster label positions (shown only in cluster mode) ──
    const usedCategories = Array.from(new Set(data.nodes.map(n => n.category)));

    // ── Force simulation ──
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((l) => layoutMode === "cluster" ? 60 - l.weight * 30 : 120 - l.weight * 60)
        .strength((l) => layoutMode === "cluster" ? l.weight * 0.8 : l.weight * 0.6)
      )
      .force("charge", d3.forceManyBody().strength(layoutMode === "cluster" ? -120 : -180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 6));

    // Add forceX/forceY for cluster mode — pull nodes toward their category centroid
    if (layoutMode === "cluster") {
      simulation
        .force("clusterX", d3.forceX<SimNode>((d) => {
          const pos = CLUSTER_POSITIONS[d.category] ?? [0.5, 0.5];
          return pos[0] * width;
        }).strength(0.35))
        .force("clusterY", d3.forceY<SimNode>((d) => {
          const pos = CLUSTER_POSITIONS[d.category] ?? [0.5, 0.5];
          return pos[1] * height;
        }).strength(0.35));
    }

    simulationRef.current = simulation;

    // ── Cluster label bubbles (background, shown in cluster mode only) ──
    if (layoutMode === "cluster") {
      const labelGroup = g.append("g").attr("class", "cluster-labels");
      usedCategories.forEach((cat) => {
        const pos = CLUSTER_POSITIONS[cat] ?? [0.5, 0.5];
        const cx = pos[0] * width;
        const cy = pos[1] * height;
        const color = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;

        // Soft halo circle
        labelGroup.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 52)
          .attr("fill", color)
          .attr("fill-opacity", 0.04)
          .attr("stroke", color)
          .attr("stroke-opacity", 0.12)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 3");

        // Category label
        labelGroup.append("text")
          .attr("x", cx)
          .attr("y", cy - 58)
          .attr("text-anchor", "middle")
          .attr("fill", color)
          .attr("fill-opacity", 0.55)
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .attr("font-family", "Inter, sans-serif")
          .attr("letter-spacing", "0.05em")
          .attr("pointer-events", "none")
          .text(cat.toUpperCase());
      });
    }

    // ── Glow filter ──
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // ── Draw edges ──
    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup
      .selectAll("line.edge-visible")
      .data(simLinks)
      .join("line")
      .attr("class", "edge-visible")
      .attr("stroke", "#ffffff12")
      .attr("stroke-width", (d) => Math.max(1, d.weight * 4))
      .attr("stroke-linecap", "round")
      .attr("pointer-events", "none");

    // Invisible wider hit-area for edge hover
    const linkHit = linkGroup
      .selectAll("line.edge-hit")
      .data(simLinks)
      .join("line")
      .attr("class", "edge-hit")
      .attr("stroke", "transparent")
      .attr("stroke-width", 14)
      .attr("stroke-linecap", "round")
      .style("cursor", "crosshair")
      .on("mouseenter", (event: MouseEvent, d: SimLink) => {
        const rect = container.getBoundingClientRect();
        const idx = simLinks.indexOf(d);
        link.filter((_: SimLink, i: number) => i === idx)
          .attr("stroke", "#ffffff35")
          .attr("stroke-width", Math.max(2, d.weight * 5 + 1));
        setEdgeTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          sharedTags: d.sharedTags,
          weight: d.weight,
        });
      })
      .on("mousemove", (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        setEdgeTooltip((prev) =>
          prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : prev
        );
      })
      .on("mouseleave", (_event: MouseEvent, d: SimLink) => {
        const idx = simLinks.indexOf(d);
        link.filter((_: SimLink, i: number) => i === idx)
          .attr("stroke", "#ffffff12")
          .attr("stroke-width", Math.max(1, d.weight * 4));
        setEdgeTooltip(null);
      });

    // ── Draw nodes ──
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as unknown as (selection: d3.Selection<d3.BaseType | SVGGElement, SimNode, SVGGElement, unknown>) => void
      );

    // Node circles
    node.append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => CATEGORY_COLORS[d.category] ?? DEFAULT_COLOR)
      .attr("fill-opacity", 0.15)
      .attr("stroke", (d) => CATEGORY_COLORS[d.category] ?? DEFAULT_COLOR)
      .attr("stroke-width", 1.5)
      .attr("filter", "url(#glow)");

    // Node labels (truncated)
    node.append("text")
      .text((d) => truncate(d.content, 22))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d) + 14)
      .attr("fill", "#ffffff80")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("pointer-events", "none");

    // Click handler
    node.on("click", (_event, d) => {
      setSelectedNode(d);
      onNodeClick?.(d);
    });

    // Node hover tooltip
    node
      .on("mouseenter", (event: MouseEvent, d: SimNode) => {
        const rect = container.getBoundingClientRect();
        setEdgeTooltip(null);
        setNodeTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
        d3.select(event.currentTarget as Element).select("circle")
          .attr("fill-opacity", 0.35)
          .attr("stroke-width", 2.5);
      })
      .on("mouseleave", (event: MouseEvent) => {
        setNodeTooltip(null);
        d3.select(event.currentTarget as Element).select("circle")
          .attr("fill-opacity", 0.15)
          .attr("stroke-width", 1.5);
      });

    // ── Tick ──
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      linkHit
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick, layoutMode]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Layout toggle — top-right corner */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setLayoutMode("free")}
          title="Free layout"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            layoutMode === "free"
              ? "bg-purple-600 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Shuffle className="w-3 h-3" />
          Free
        </button>
        <button
          onClick={() => setLayoutMode("cluster")}
          title="Cluster by category"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            layoutMode === "cluster"
              ? "bg-purple-600 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Layers className="w-3 h-3" />
          Cluster
        </button>
      </div>

      {/* Node tooltip */}
      {nodeTooltip && (
        <div
          className="absolute z-20 pointer-events-none max-w-[220px] rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-3 shadow-xl"
          style={{ left: nodeTooltip.x + 12, top: nodeTooltip.y - 8 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: CATEGORY_COLORS[nodeTooltip.node.category] ?? DEFAULT_COLOR }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              {nodeTooltip.node.category}
            </span>
          </div>
          <p className="text-xs text-white/85 leading-relaxed line-clamp-4">
            {nodeTooltip.node.content}
          </p>
          {nodeTooltip.node.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {nodeTooltip.node.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/45">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edge tooltip — shows shared tags/keywords explaining the connection */}
      {edgeTooltip && (
        <div
          className="absolute z-20 pointer-events-none max-w-[240px] rounded-xl border border-cyan-500/20 bg-black/85 backdrop-blur-md p-3 shadow-xl"
          style={{ left: edgeTooltip.x + 12, top: edgeTooltip.y - 8 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/70">
              Connected by
            </span>
            <span className="ml-auto text-[10px] text-white/30">
              {Math.round(edgeTooltip.weight * 100)}% match
            </span>
          </div>
          {edgeTooltip.sharedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {edgeTooltip.sharedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 italic">Semantic similarity</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[280px]">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px] text-white/40 capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function nodeRadius(d: MemoryNode): number {
  return 8 + (d.importance / 100) * 10;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}
