export function parseDebateText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  
  const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);
  const comments = [];

  for (const line of lines) {
    const match = line.match(/^([^:]{1,80}):\s+(.+)$/);
    if (!match) continue;

    comments.push({
      speaker: match[1].trim(),
      text: match[2].trim().replace(/\s+/g, ' '),
    });
  }

  return comments;
}
