export function buildGraph(nodes, links) {
  // Deduplication logic: merge nodes with identical claim text
  const mergedNodes = [];
  const textToId = {};
  let currentId = 0;

  nodes.forEach(node => {
    // Normalize text for comparison
    const normalizedText = node.text ? node.text.trim().toLowerCase() : '';
    
    if (textToId[normalizedText] !== undefined) {
      // Already exists, map original id to existing canonical id
      textToId[node.id] = textToId[normalizedText];
    } else {
      const canonicalId = `node-${currentId++}`;
      textToId[normalizedText] = canonicalId;
      textToId[node.id] = canonicalId; // Map original id to new canonical id

      mergedNodes.push({
        ...node,
        id: canonicalId,
        text: node.text,
      });
    }
  });

  // Ensure link types are valid and update source/target to canonical ids
  const validLinkTypes = new Set(['support', 'attack', 'question', 'restatement']);
  
  const processedLinks = links
    .map(link => {
      const newSource = textToId[link.source];
      const newTarget = textToId[link.target];
      
      // Filter out self-loops after deduplication
      if (!newSource || !newTarget || newSource === newTarget) {
        return null;
      }
      
      // Default to restatement if unknown
      const type = validLinkTypes.has(link.type) ? link.type : 'restatement';
      
      return {
        ...link,
        source: newSource,
        target: newTarget,
        type
      };
    })
    .filter(Boolean);

  // Remove duplicate links between the same source and target
  const uniqueLinks = [];
  const seenLinks = new Set();
  
  processedLinks.forEach(link => {
    const key = `${link.source}->${link.target}:${link.type}`;
    if (!seenLinks.has(key)) {
      seenLinks.add(key);
      uniqueLinks.push(link);
    }
  });

  return {
    nodes: mergedNodes,
    links: uniqueLinks
  };
}
