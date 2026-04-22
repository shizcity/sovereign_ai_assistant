import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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

export default function MemoryGraph({ data, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: MemoryNode } | null>(null);

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

    // Build simulation-ready node/link objects (D3 mutates these)
    type SimNode = MemoryNode & d3.SimulationNodeDatum;
    type SimLink = d3.SimulationLinkDatum<SimNode> & { weight: number };

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
        return { source, target, weight: e.weight } as SimLink;
      })
      .filter((l): l is SimLink => l !== null);

    // Force simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((l) => 120 - l.weight * 60)
        .strength((l) => l.weight * 0.6)
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 6));

    // Draw edges
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "#ffffff12")
      .attr("stroke-width", (d) => Math.max(1, d.weight * 4))
      .attr("stroke-linecap", "round");

    // Draw nodes
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

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

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

    // Hover tooltip
    node
      .on("mouseenter", (event, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
        d3.select(event.currentTarget).select("circle")
          .attr("fill-opacity", 0.35)
          .attr("stroke-width", 2.5);
      })
      .on("mouseleave", (event) => {
        setTooltip(null);
        d3.select(event.currentTarget).select("circle")
          .attr("fill-opacity", 0.15)
          .attr("stroke-width", 1.5);
      });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none max-w-[220px] rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-3 shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: CATEGORY_COLORS[tooltip.node.category] ?? DEFAULT_COLOR }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              {tooltip.node.category}
            </span>
          </div>
          <p className="text-xs text-white/85 leading-relaxed line-clamp-4">
            {tooltip.node.content}
          </p>
          {tooltip.node.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tooltip.node.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/45">
                  {t}
                </span>
              ))}
            </div>
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
