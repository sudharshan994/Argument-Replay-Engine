import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { parseDebateText } from './parser.js';
import { analyzeDebate } from './nvidia.js';
import { buildGraph } from './graph.js';

const app = express();

// Helmet with relaxed settings so the API works correctly
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '50kb' }));

app.post('/api/analyze', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    if (rawText.length > 25000) {
      return res.status(413).json({
        error: 'Thread is too large. Keep it under 25,000 characters.',
      });
    }

    const comments = parseDebateText(rawText);

    if (comments.length < 2) {
      return res.status(400).json({
        error: 'Add at least two comments in the format "username: comment text".',
      });
    }

    const { nodes: rawNodes, links: rawLinks } = await analyzeDebate(comments);

    if (!rawNodes || rawNodes.length === 0) {
      return res.status(422).json({
        error: 'No logical claims were found. Try a thread with more specific arguments.',
      });
    }

    const graph = buildGraph(rawNodes, rawLinks);

    graph.meta = {
      comments: comments.length,
      classified: rawNodes.length,
      relationships: graph.links.length,
      confidence: Math.max(35, Math.min(96, Math.round((rawNodes.length / comments.length) * 100)))
    };

    return res.json(graph);
  } catch (error) {
    if (error.message?.includes('NVIDIA_API_KEY') || error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Invalid or missing NVIDIA API key. Check your .env file.',
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    process.stdout.write(`[server] Running on http://localhost:${PORT}\n`);
  });
}

export default app;
