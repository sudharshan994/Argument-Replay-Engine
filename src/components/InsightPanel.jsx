import { useMemo } from 'react';

export default function InsightPanel({ graph }) {
  const totals = useMemo(() => {
    if (!graph?.links) return { attacks: 0, supports: 0, questions: 0, restates: 0 };
    return {
      attacks: graph.links.filter(link => link.type === 'attack').length,
      supports: graph.links.filter(link => link.type === 'support').length,
      questions: graph.links.filter(link => link.type === 'question').length,
      restates: graph.links.filter(link => link.type === 'restatement').length,
    };
  }, [graph.links]);

  const { mostAttacked, mostSupported } = useMemo(() => {
    const stats = {};
    if (!graph?.nodes || !graph?.links) return { mostAttacked: null, mostSupported: null };
    
    graph.nodes.forEach(node => {
      stats[node.id] = { attack_count: 0, support_count: 0, node };
    });

    graph.links.forEach(link => {
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (stats[targetId]) {
        if (link.type === 'attack') stats[targetId].attack_count += 1;
        if (link.type === 'support') stats[targetId].support_count += 1;
      }
    });

    const sortedByAttacks = Object.values(stats).sort((a, b) => b.attack_count - a.attack_count);
    const sortedBySupports = Object.values(stats).sort((a, b) => b.support_count - a.support_count);

    return {
      mostAttacked: sortedByAttacks[0],
      mostSupported: sortedBySupports[0]
    };
  }, [graph]);

  if (!graph?.nodes?.length) return null;

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graph, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "argument_map.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCopySummary = () => {
    const summary = `Argument Analysis Summary:\n- Unique Claims: ${graph.nodes.length}\n- Attacks: ${totals.attacks}\n- Supports: ${totals.supports}\n- Questions: ${totals.questions}`;
    navigator.clipboard.writeText(summary).then(() => alert('Summary copied to clipboard!'));
  };

  const handleExportPNG = () => {
    const svg = document.querySelector('.d3-canvas svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'argument_map.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="insight-panel mt-6">
      <div className="insight-title text-2xl font-bold mb-4">Argument insights</div>

      <div className="insight-grid grid grid-cols-4 gap-4 mb-6">
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-blue-600 dark:text-blue-400">{graph.nodes.length}</strong>
          <span className="text-sm text-slate-600 dark:text-slate-300">Unique claims</span>
        </div>
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-red-600 dark:text-red-400">{totals.attacks}</strong>
          <span className="text-sm text-slate-600 dark:text-slate-300">Attacks</span>
        </div>
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-green-600 dark:text-green-400">{totals.supports}</strong>
          <span className="text-sm text-slate-600 dark:text-slate-300">Supports</span>
        </div>
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-amber-600 dark:text-amber-400">{graph.meta?.confidence || 0}%</strong>
          <span className="text-sm text-slate-600 dark:text-slate-300">Confidence</span>
        </div>
      </div>

      <div className="insight-list space-y-4">
        {mostAttacked?.attack_count > 0 && (
          <div className="insight-item border-l-4 border-red-500 pl-4 py-2">
            <span className="font-semibold block mb-1">Most contested</span>
            <div className="text-slate-700 dark:text-slate-200">
              <span className="italic">"{truncate(mostAttacked.node.text, 82)}"</span>
              {' '}was attacked {mostAttacked.attack_count} time{mostAttacked.attack_count !== 1 ? 's' : ''}.
            </div>
          </div>
        )}

        {mostSupported?.support_count > 0 && (
          <div className="insight-item border-l-4 border-green-500 pl-4 py-2">
            <span className="font-semibold block mb-1">Most supported</span>
            <div className="text-slate-700 dark:text-slate-200">
              <span className="italic">"{truncate(mostSupported.node.text, 82)}"</span>
              {' '}was supported {mostSupported.support_count} time{mostSupported.support_count !== 1 ? 's' : ''}.
            </div>
          </div>
        )}

        <div className="export-actions flex gap-4 mt-6">
          <button onClick={handleExportPNG} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Export PNG</button>
          <button onClick={handleExportJSON} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition">Export JSON</button>
          <button onClick={handleCopySummary} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Copy Summary</button>
        </div>
      </div>
    </div>
  );
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}...` : str;
}
