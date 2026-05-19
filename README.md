# Free Cluie

Free Cluie is an open-source desktop AI assistant from **Envoyc** built to help people work faster, think clearer, and automate repetitive tasks. It is designed for community use, local customization, and white-label deployment.

Website: [www.envoyc.com](https://www.envoyc.com)

## What It Does

- Real-time AI assistance in a desktop app
- Screenshot-based analysis and explanation
- Voice and text workflows for everyday productivity
- Local and cloud model support
- Cross-platform support for Windows, macOS, and Linux

## Why Envoyc Built It

Envoyc helps businesses build personalized B2B AI automations that reduce operational cost and time. Free Cluie is our way of contributing to the community while showing what practical AI tooling can look like in the real world.

If you want help integrating AI into your business, visit [www.envoyc.com](https://www.envoyc.com) to talk about a custom build.

## Quick Start

### Prerequisites

- Node.js installed
- Git installed
- One of the supported AI options:
  - Gemini API key
  - OpenAI API key
  - Ollama for local/private usage

### Install

```bash
git clone [repository-url]
cd free-cluie
npm install
```

### Environment Variables

Create a `.env` file in the project root.

#### Gemini

```env
GEMINI_API_KEY=your_api_key_here
```

#### OpenAI

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-nano
```

#### Ollama

```env
USE_OLLAMA=true
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
```

### Run

```bash
npm start
```

For a production build:

```bash
npm run dist
```

## Features

- Invisible-style desktop assistant
- Fast screenshot analysis
- Real-time transcription and context handling
- Chat-based problem solving
- Privacy-friendly local model support
- Customizable for personal or commercial deployments

## Supported AI Options

### Ollama

- Local inference
- No API usage cost
- Better privacy control

### OpenAI

- Strong general-purpose reasoning
- Good for chat, analysis, and automation

### Gemini

- Strong multimodal performance
- Fast responses for many workflows

## Troubleshooting

- If the app does not start, make sure port `5180` is free.
- If you hit install issues on Sharp, try reinstalling dependencies with the recommended build flags in the project scripts.
- If Ollama is used, confirm the local server is running at `http://localhost:11434`.

## Community Use

This project is intended to be forked, extended, and adapted. If you build on top of it, keep the code practical, keep the UX clean, and make it useful for real users.

## Contact

For custom AI systems, workflow automation, and business deployments, visit:

[www.envoyc.com](https://www.envoyc.com)
