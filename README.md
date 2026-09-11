# Argument Replay Engine

Argument Replay Engine turns a discussion thread into an interactive map of claims and responses. Paste comments in `speaker: message` format, run the analysis, and inspect the resulting relationships as a D3 graph. The app also provides replay controls, speaker summaries, insight counts, and export options.

[Open the live app](https://arguement-reply-engine-final.vercel.app)

## Why I built it

In a long discussion, it is easy to lose track of which point is being challenged, supported, or repeated. I built this project to make that structure visible. The input stays simple, while the analysis adds a useful view of the conversation: who made each claim, how strong it was scored, which comments it relates to, and where the main points of disagreement are.

The project also gave me a practical way to connect a React interface, an Express API, an external language model API, and a D3 visualization in one application.

## Features

- Paste a thread or load one of the Climate Change, AI Ethics, and Vaccine Policy presets.
- Validate comment lines before submitting them for analysis.
- Classify comments as claims, counter-claims, agreements, questions, tangents, or insults.
- Display attacks, supports, questions, and restatements as different graph relationships.
- Merge nodes with identical normalized claim text and remove duplicate links.
- Replay the graph one node at a time with the Play/Pause control.
- Drag and zoom graph nodes, and inspect a node's speaker, text, strength score, and detected fallacy.
- View claim, attack, agreement, and average-strength summaries for each speaker.
- Export the argument map as PNG, export the graph as JSON, or copy a short text summary.
- Apply a saved or system light/dark theme preference.

## Tech stack

### Frontend

- React 19
- Vite 8
- D3.js 7
- Tailwind CSS 4
- Axios

### Backend

- Node.js with Express 5
- NVIDIA NIM through the OpenAI-compatible SDK
- `helmet` and `cors` for basic API middleware
- `dotenv` for local environment variables

### Development

- ESLint 10
- Vitest 5 with jsdom
- Vercel serverless deployment through `api/index.js`

## How it works

1. The frontend checks that the input contains at least two non-empty lines in `speaker: message` format.
2. It sends the raw thread to `POST /api/analyze`.
3. The Express route limits the request body to 50 KB and rejects threads longer than 25,000 characters.
4. `server/parser.js` extracts the speaker and message from each valid line.
5. `server/nvidia.js` asks NVIDIA NIM to classify each comment, score its strength, identify possible fallacies, and point to earlier comments it responds to.
6. `server/graph.js` converts those results into canonical nodes and links. Duplicate claims and duplicate relationships are removed here.
7. The frontend renders the response with `GraphCanvas`, `InsightPanel`, and `SpeakerPanel`.

The graph uses these relationship types:

| Type | Meaning |
| --- | --- |
| `attack` | A counter-claim or insult challenges another comment. |
| `support` | An agreement supports another comment. |
| `question` | A question points to the comment it asks about. |
| `restatement` | A claim or tangent is represented as a neutral relationship. |

## Project structure

```text
api/
  index.js                 Vercel entry point for the Express app
server/
  graph.js                 Node and link normalization
  index.js                 Express routes and API validation
  nvidia.js                NVIDIA NIM request and response mapping
  parser.js                `speaker: message` input parser
src/
  App.jsx                  Main input, analysis, replay, and theme state
  components/
    GraphCanvas.jsx        D3 graph and node interactions
    InsightPanel.jsx       Counts, notable claims, and exports
    SpeakerPanel.jsx       Per-speaker summaries
  pages/
    AccessibilityPage.jsx Accessibility settings page
  __tests__/               Parser and graph tests
vercel.json                Vercel rewrites for the app and API
```

## Installation

You need Node.js 20 or newer and an NVIDIA NIM API key.

```bash
git clone https://github.com/sudharshan994/Argument-Replay-Engine.git
cd Argument-Replay-Engine
npm install
```

Create a local `.env` file from `.env.example` and set the API key:

```env
NVIDIA_API_KEY=your_nvidia_api_key
```

`NVIDIA_MODEL` is optional. When it is not set, the server uses `meta/llama-3.2-11b-vision-instruct`.

`VITE_API_URL` is also optional. During local development, leaving it unset lets Vite proxy `/api` requests to `http://localhost:3001`. Set it when the frontend needs to call an API running at a different URL.

## Running locally

Start the frontend and backend together:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the local API runs on `http://localhost:3001`.

You can also run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## API

### `POST /api/analyze`

Request:

```json
{
  "rawText": "Alice: This is my claim.\nBob: I disagree with that claim."
}
```

The response contains `nodes`, `links`, and `meta` fields:

```json
{
  "nodes": [
    {
      "id": "node-0",
      "speaker": "Alice",
      "text": "Alice makes a claim.",
      "type": "claim",
      "strengthScore": 50,
      "fallacyDetected": null
    }
  ],
  "links": [
    {
      "source": "node-1",
      "target": "node-0",
      "type": "attack"
    }
  ],
  "meta": {
    "comments": 2,
    "classified": 2,
    "relationships": 1,
    "confidence": 96
  }
}
```

### `GET /api/health`

Returns a small health response with `status` and a timestamp. This is useful for checking that the API is reachable without making an analysis request.

## Useful commands

```bash
npm run build   # build the frontend for production
npm run lint    # run ESLint
npm test        # run the Vitest test suite
```

## Implementation notes

The model is asked to return one JSON object per input comment. The server strips simple Markdown code fences if the model includes them, extracts the JSON payload, validates the result, and maps model IDs to canonical graph IDs. Links that point to missing nodes or create self-loops after deduplication are discarded.

The graph is recreated when the graph data or replay step changes. D3 handles the force simulation, zooming, dragging, curved relationship paths, and the node tooltip. PNG export clones the SVG first, so exporting does not modify the graph currently on screen.

## Things I learned

The most important part of this project was keeping the boundaries between parsing, classification, graph construction, and rendering clear. The model output is not treated as the final graph: it still needs validation and normalization before D3 can use it. I also had to account for the difference between the local Express process and the Vercel function entry point when deploying the API.

## Possible next steps

- Add more focused tests for malformed model responses and API error cases.
- Show an inline loading state with more detail for slow model requests.
- Add a small request history so users can compare multiple analyses.
- Improve graph layout controls for very large discussion threads.
- Add a deployment check that exercises both the frontend and `/api/health` route.

## Author

Built by [Vellore Venkateshan Sudharshan](https://github.com/sudharshan994).

The project is licensed under the MIT License. See [LICENSE](LICENSE) for details.