import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Default model — confirmed available on integrate.api.nvidia.com
// Override with NVIDIA_MODEL in your .env if needed.
const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 120000,
});

async function callNvidia(prompt, maxRetries = 3) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('Missing NVIDIA_API_KEY. Add it to your .env file.');
  }

  let lastErr;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.15,
        max_tokens: 4096,
      });

      return response.choices[0].message.content.trim();
    } catch (err) {
      lastErr = err;
      const status = err.status ?? err.response?.status;

      if (status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 3;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue;
      }

      if (status === 410) {
        throw new Error(
          `The AI model "${MODEL}" is no longer available (410 Gone). ` +
          `Set NVIDIA_MODEL in your .env to an active NIM model, ` +
          `e.g. NVIDIA_MODEL=meta/llama-3.1-8b-instruct`
        );
      }

      throw err;
    }
  }

  throw lastErr ?? new Error('NVIDIA API failed after retries.');
}

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstArray = cleaned.indexOf('[');
  const lastArray = cleaned.lastIndexOf(']');
  const firstObject = cleaned.indexOf('{');
  const lastObject = cleaned.lastIndexOf('}');

  if (firstArray !== -1 && lastArray > firstArray) {
    return JSON.parse(cleaned.slice(firstArray, lastArray + 1));
  }
  if (firstObject !== -1 && lastObject > firstObject) {
    return JSON.parse(cleaned.slice(firstObject, lastObject + 1));
  }
  return JSON.parse(cleaned);
}

export async function analyzeDebate(comments) {
  const input = comments
    .map((comment, index) => `[${index}] ${comment.speaker}: ${comment.text}`)
    .join('\n');

  const prompt = `You are an expert debate analyst. Analyze the following discussion thread.

For EACH comment return one JSON object. Return ALL objects as a single JSON array.

Each object MUST have these exact fields:
- "id": string — the number from the brackets, e.g. "0", "1", "2"
- "speaker": string — the speaker's name exactly as written
- "text": string | null — one clean neutral sentence summarizing the logical point, or null for off-topic/insults
- "type": string — exactly one of: "claim", "counter-claim", "agreement", "question", "tangent", "insult"
- "targets": array of strings — IDs of prior comments this directly responds to (empty array if none)
- "strengthScore": integer 0-100 — logical strength (100=excellent, 0=fallacy/insult/tangent)
- "fallacyDetected": string | null — name a logical fallacy if present (e.g. "Ad hominem", "Straw man", "Appeal to motive"), else null

Rules:
- targets must only reference earlier IDs (smaller number than current)
- Return ONLY the JSON array, no explanation, no markdown fences

Thread:
${input}`;

  const text = await callNvidia(prompt);

  let parsed;
  try {
    parsed = parseJSON(text);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  } catch (err) {
    throw new Error(`NVIDIA returned invalid JSON: ${err.message}`);
  }

  const nodes = [];
  const links = [];

  const typeToLinkType = {
    'claim': 'restatement',
    'counter-claim': 'attack',
    'agreement': 'support',
    'question': 'question',
    'tangent': 'restatement',
    'insult': 'attack',
  };

  for (const item of parsed) {
    if (!item || !item.text) continue;

    nodes.push({
      id: String(item.id ?? nodes.length),
      speaker: String(item.speaker ?? 'Unknown'),
      text: String(item.text),
      type: ['claim', 'counter-claim', 'agreement', 'question', 'tangent', 'insult'].includes(item.type)
        ? item.type
        : 'claim',
      strengthScore: typeof item.strengthScore === 'number'
        ? Math.max(0, Math.min(100, item.strengthScore))
        : 50,
      fallacyDetected: item.fallacyDetected || null,
    });

    if (Array.isArray(item.targets)) {
      for (const target of item.targets) {
        links.push({
          source: String(item.id ?? ''),
          target: String(target),
          type: typeToLinkType[item.type] ?? 'restatement',
        });
      }
    }
  }

  return { nodes, links };
}
