import { useMemo } from 'react';

export default function SpeakerPanel({ graph }) {
  const speakerStats = useMemo(() => {
    if (!graph || !graph.nodes || !graph.links) return [];

    const stats = {};

    graph.nodes.forEach(node => {
      const speaker = node.speaker || 'Unknown';
      if (!stats[speaker]) {
        stats[speaker] = {
          speaker,
          claimsMade: 0,
          attacksThrown: 0,
          agreementsGiven: 0,
          totalScore: 0,
          scoredClaims: 0,
          nodeIds: new Set()
        };
      }

      stats[speaker].claimsMade += 1;
      stats[speaker].nodeIds.add(node.id);
      
      if (node.strengthScore) {
        stats[speaker].totalScore += node.strengthScore;
        stats[speaker].scoredClaims += 1;
      }
    });

    graph.links.forEach(link => {
      // Find the source node to get the speaker who is making the link
      const sourceNode = graph.nodes.find(n => n.id === link.source.id || n.id === link.source);
      if (sourceNode) {
        const speaker = sourceNode.speaker || 'Unknown';
        if (stats[speaker]) {
          if (link.type === 'attack') {
            stats[speaker].attacksThrown += 1;
          } else if (link.type === 'support') {
            stats[speaker].agreementsGiven += 1;
          }
        }
      }
    });

    return Object.values(stats).map(s => ({
      ...s,
      avgScore: s.scoredClaims > 0 ? Math.round(s.totalScore / s.scoredClaims) : 0
    }));
  }, [graph]);

  if (!speakerStats.length) return null;

  return (
    <section className="speaker-panel p-4 mt-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Speaker Stance Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {speakerStats.map(stat => (
          <div key={stat.speaker} className="speaker-card p-4 bg-white dark:bg-slate-800 rounded shadow border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{stat.speaker}</h4>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <p>Claims Made: <span className="font-medium">{stat.claimsMade}</span></p>
              <p>Attacks Thrown: <span className="font-medium">{stat.attacksThrown}</span></p>
              <p>Agreements Given: <span className="font-medium">{stat.agreementsGiven}</span></p>
              <p>Avg Strength Score: <span className={`font-bold ${stat.avgScore >= 70 ? 'text-green-500' : stat.avgScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{stat.avgScore}</span></p>
            </div>
            {/* Simple inline SVG bar chart */}
            <div className="mt-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Claim Types Comparison</div>
              <svg width="100%" height="40" className="bg-slate-100 dark:bg-slate-700 rounded">
                {(() => {
                  const max = Math.max(stat.claimsMade, stat.attacksThrown, stat.agreementsGiven, 1);
                  const w1 = (stat.claimsMade / max) * 100;
                  const w2 = (stat.attacksThrown / max) * 100;
                  const w3 = (stat.agreementsGiven / max) * 100;
                  return (
                    <g>
                      <rect x="0" y="5" height="8" width={`${w1}%`} fill="#3b82f6" />
                      <rect x="0" y="15" height="8" width={`${w2}%`} fill="#ef4444" />
                      <rect x="0" y="25" height="8" width={`${w3}%`} fill="#22c55e" />
                    </g>
                  );
                })()}
              </svg>
              <div className="flex text-[10px] justify-between mt-1 text-slate-500">
                <span className="text-blue-500">Claims</span>
                <span className="text-red-500">Attacks</span>
                <span className="text-green-500">Agreements</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
