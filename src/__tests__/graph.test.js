import { describe, it, expect } from 'vitest';
import { buildGraph } from '../../server/graph.js';

describe('buildGraph', () => {
  it('returns { nodes, links } with correct shape', () => {
    const rawNodes = [{ id: '1', text: 'A' }, { id: '2', text: 'B' }];
    const rawLinks = [{ source: '1', target: '2', type: 'support' }];
    
    const result = buildGraph(rawNodes, rawLinks);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(1);
    expect(result.nodes[0]).toHaveProperty('id');
    expect(result.nodes[0]).toHaveProperty('text', 'A');
    expect(result.links[0]).toHaveProperty('source');
    expect(result.links[0]).toHaveProperty('target');
    expect(result.links[0]).toHaveProperty('type', 'support');
  });

  it('deduplication merges identical claim text into one node', () => {
    const rawNodes = [
      { id: '1', text: 'Climate change is real' },
      { id: '2', text: 'climate change is real' }, // should merge
      { id: '3', text: 'Another point' }
    ];
    const rawLinks = [
      { source: '2', target: '3', type: 'support' }
    ];
    
    const result = buildGraph(rawNodes, rawLinks);
    
    expect(result.nodes).toHaveLength(2); // 1 and 2 merged
    // The link from 2 to 3 should now be from the canonical id of 1/2 to 3
    expect(result.links).toHaveLength(1);
    expect(result.links[0].source).toEqual(result.nodes[0].id);
  });

  it('link type is one of: support | attack | question | restatement', () => {
    const rawNodes = [
      { id: '1', text: 'A' },
      { id: '2', text: 'B' },
      { id: '3', text: 'C' }
    ];
    const rawLinks = [
      { source: '1', target: '2', type: 'attack' },
      { source: '2', target: '3', type: 'unknown_type' } // should default to restatement
    ];
    
    const result = buildGraph(rawNodes, rawLinks);
    
    expect(result.links[0].type).toBe('attack');
    expect(result.links[1].type).toBe('restatement');
  });
});
