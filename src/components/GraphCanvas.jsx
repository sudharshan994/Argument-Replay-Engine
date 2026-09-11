import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function GraphCanvas({ graph, replayStep }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!graph?.nodes?.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.min(620, Math.max(420, Math.round(window.innerHeight * 0.58)));

    const visibleNodes = graph.nodes
      .slice(0, replayStep + 1)
      .map(node => ({ ...node, radius: 18 + (node.strengthScore || 50) / 10 }));
    const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
    const visibleLinks = graph.links
      .filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      })
      .map(link => ({
        ...link,
        source: typeof link.source === 'object' ? link.source.id : link.source,
        target: typeof link.target === 'object' ? link.target.id : link.target,
      }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('class', 'd3-canvas');

    const defs = svg.append('defs');
    
    // Glowing filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const linkColors = {
      attack: '#ef4444',
      support: '#22c55e',
      question: '#f59e0b',
      restatement: '#94a3b8',
    };

    Object.entries(linkColors).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 35)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
        .attr('opacity', 0.8);
    });

    const group = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', event => group.attr('transform', event.transform));
    svg.call(zoom);

    // ANTI-GRAVITY SIMULATION
    const simulation = d3.forceSimulation(visibleNodes)
      .force("link", d3.forceLink(visibleLinks).id(d => d.id).distance(120).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("collision", d3.forceCollide().radius(d => d.radius + 20))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03))
      .alphaDecay(0.015)
      .velocityDecay(0.25);

    group.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(visibleLinks)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', d => linkColors[d.type] || linkColors.restatement)
      .attr('stroke-width', d => d.confidence ? Math.max(1, Math.min(4, d.confidence * 4)) : 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .attr('stroke-dasharray', d => {
        if (d.type === 'attack') return '5, 5';
        if (d.type === 'question') return '2, 4';
        return 'none';
      })
      .style('opacity', 0)
      .transition()
      .duration(600)
      .style('opacity', 1);

    // CSS animation for attack links in App.css or index.css
    group.selectAll('path').each(function(d) {
      if (d.type === 'attack') {
        d3.select(this).classed('flowing-dash', true);
      }
      if (d.type === 'restatement') {
        // simulate double-line
        d3.select(this).attr('stroke-width', 4).attr('stroke-dasharray', '3,1'); 
      }
    });

    const node = group.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(visibleNodes, d => d.id)
      .join(
        enter => enter.append('g')
          .style('cursor', 'grab')
          .style('opacity', 0)
          .call(enter => enter.transition().duration(600).ease(d3.easeCubicOut).style('opacity', 1)),
        update => update,
        exit => exit.remove()
      );

    const drag = d3.drag()
      .on('start', (event, item) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        item.fx = item.x;
        item.fy = item.y;
      })
      .on('drag', (event, item) => {
        // node gets "mass"
        item.fx += (event.x - item.fx) * 0.5;
        item.fy += (event.y - item.fy) * 0.5;
      })
      .on('end', (event, item) => {
        if (!event.active) simulation.alphaTarget(0);
        item.fx = null;
        item.fy = null;
      });

    node.call(drag);

    // Particle trails setup


    const getScoreColor = (score) => {
      if (score >= 70) return '#22c55e'; // green
      if (score >= 40) return '#f59e0b'; // amber
      return '#ef4444'; // red
    };

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#ffffff')
      .attr('stroke', d => getScoreColor(d.strengthScore || 50))
      .attr('stroke-width', 3)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -(d.radius + 8))
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#475569')
      .text(d => {
        const text = d.text || '';
        return text.length > 20 ? `${text.slice(0, 20)}...` : text;
      });

    node.on('mouseenter', (event, item) => {
      // Repel neighbors
      simulation.force("charge", d3.forceManyBody().strength(d => d.id === item.id ? -2000 : -600));
      simulation.alpha(0.3).restart();
      
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 15,
        speaker: item.speaker,
        text: item.text,
        score: item.strengthScore || 50,
        fallacy: item.fallacyDetected,
      });
    });

    node.on('mousemove', event => {
      const rect = container.getBoundingClientRect();
      setTooltip(prev => prev ? {
        ...prev,
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 15,
      } : null);
    });

    node.on('mouseleave', () => {
      // Reset charge
      simulation.force("charge", d3.forceManyBody().strength(-600));
      simulation.alpha(0.1).restart();
      setTooltip(null);
    });

    simulation.on('tick', () => {
      group.selectAll('.links path').attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      group.selectAll('.nodes g')
        .attr('transform', item => `translate(${item.x},${item.y})`);
    });

    return () => simulation.stop();
  }, [graph, replayStep]);

  return (
    <div className="graph-container relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full bg-slate-50 dark:bg-slate-900" />
      
      <div className="legend absolute bottom-4 left-4 bg-white dark:bg-slate-800 p-2 rounded shadow text-xs flex flex-col gap-1">
        <div className="flex items-center gap-2"><span className="w-3 h-0.5 border-t border-red-500 border-dashed" />Attack</div>
        <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-green-500" />Support</div>
        <div className="flex items-center gap-2"><span className="w-3 h-0.5 border-t border-amber-500 border-dotted" />Question</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 border-t-2 border-b-2 border-slate-400" />Restatement</div>
      </div>

      {tooltip && (
        <div className="node-tooltip absolute z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded shadow-lg w-64 pointer-events-none" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{tooltip.speaker}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 italic">"{tooltip.text}"</div>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold ${tooltip.score >= 70 ? 'text-green-500' : tooltip.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>Score: {tooltip.score}/100</span>
            {tooltip.fallacy && <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded">{tooltip.fallacy}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
