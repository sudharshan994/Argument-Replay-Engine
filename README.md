<div align="center">

# 🗣️ Argument Replay Engine

**Argument Replay Engine turns a messy discussion thread into a readable map of claims, responses, questions, and supporting points.**

[![CI](https://github.com/sudharshan994/Argument-Replay-Engine/actions/workflows/ci.yml/badge.svg)](https://github.com/sudharshan994/Argument-Replay-Engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)](https://expressjs.com)
[![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM_AI-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)

[Live Demo](https://arguement-reply-engine-final.vercel.app)

</div>

---

## 🎬 Demo

Paste a conversation into the editor or choose one of the built-in examples. The app sends the thread to the analysis API, then shows the result as an interactive graph with speaker summaries and relationship counts.

---

## 📖 Table of Contents

- [Why It Matters](#why-it-matters)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## 💡 Why It Matters

Long discussion threads are difficult to review when claims, counterclaims, questions, and repeated points are all mixed together. **Argument Replay Engine** gives each comment a place in the conversation and makes the relationships easier to follow.

It is a small full-stack application: React and D3 on the frontend, an Express API in the middle, and NVIDIA NIM for classifying comments and identifying relationships.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🕒 **Replay Mode** | Step-by-step timeline slider to watch arguments unfold chronologically with smooth D3 transitions. |
| 🛡️ **Argument Strength Score** | Each comment receives a strength score and, when relevant, a detected fallacy. |
| 👤 **Speaker Stance Summary** | Breakdowns per participant showing claims, attacks, agreements, and average strength scores. |
| 📤 **Export Functionality** | One-click export of the D3 canvas (PNG), graph data (JSON), and shareable clipboard summaries. |
| 🌗 **Dark / Light Theme** | The interface keeps the selected theme between visits. |
| 📚 **Sample Debate Presets** | One-click loadable debates ("Climate change", "AI ethics", "Vaccine policy") for instant testing. |
| 🌌 **Interactive Graph** | A D3 force layout shows the direction and type of each relationship. |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A["👤 User\nPastes debate text"] --> B["💻 React Frontend\nVite + D3 Graph"]
    B -->|POST /analyze| C["⚙️ Express API\nParser + Graph Builder"]
    C -->|AI Classification| D["🧠 NVIDIA NIM\nLLM via OpenAI SDK"]
    D -->|Classified nodes & links| C
    C -->|JSON response| B
    B --> E["🌌 Interactive\nArgument Map"]
    B --> F["📊 SpeakerPanel"]
    B --> G["📤 Export"]
```

---

## 💻 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, D3.js 7, TailwindCSS 4 |
| **Backend** | Express 5, Node.js |
| **AI/ML** | NVIDIA NIM (via OpenAI-compatible SDK) |
| **Code Quality** | ESLint 10, Vitest |
| **CI/CD** | GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- NVIDIA NIM API key ([get one here](https://build.nvidia.com))

### 1. Clone the repository

```bash
git clone https://github.com/sudharshan994/Argument-Replay-Engine.git
cd Argument-Replay-Engine
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY
```

| Variable | Description |
|----------|-------------|
| `NVIDIA_API_KEY` | Your NVIDIA NIM API key |
| `VITE_API_URL` | Backend URL (default: `http://localhost:3001`) |

### 3. Install & Run

We use `concurrently` to run both the frontend and backend with a single command.

```bash
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and the API at `http://localhost:3001`.

---

## 🔌 API Reference

### `POST /analyze`

Analyze a debate thread and return an argument graph.

**Request:**
```json
{
  "rawText": "Alice: Claim text\nBob: Response text"
}
```

**Response:**
```json
{
  "nodes": [
    { 
      "id": "1", 
      "label": "Claim text", 
      "type": "claim", 
      "speaker": "Alice",
      "strengthScore": 85,
      "fallacyDetected": null
    }
  ],
  "links": [
    { "source": "2", "target": "1", "type": "attack" }
  ],
  "meta": {
    "comments": 2,
    "classified": 2,
    "relationships": 1,
    "confidence": 0.85
  }
}
```

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository.
2. Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**. Ensure the CI pipeline passes.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with 💻 by [Vellore Venkateshan Sudharshan](https://github.com/sudharshan994)**

</div>
