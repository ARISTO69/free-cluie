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

- Node.js 24.0.0 installed
- Git installed
- One of the supported AI options:
  - Gemini API key
  - OpenAI API key
  - OpenRouter API key
  - Mistral API key
  - Ollama for local/private usage

### Windows Setup

1. Check your Node.js version.

```bash
node -v
```

If the version is anything other than `v24.0.0` or another `24.x` release, run `#1 Install NodeJS 24.0.0.bat`.

2. Run `#2 Create env and Install.bat`.

3. Run `#3 Add your API keys.bat` and enter your keys one by one.

Press `Enter` for any API you do not have.

4. Run `#4 Run Command.bat`.

### Mac/Linux Setup

1. Check your Node.js version.

```bash
node -v
```

If you have Node.js `22.x`, `26.x`, or any version other than `24.x`, remove the current install and install Node.js 24.0.0.

If you use `nvm`:

```bash
nvm uninstall <current-version>
nvm install 24.0.0
nvm use 24.0.0
```

If you use Homebrew on macOS:

```bash
brew uninstall node
brew install node@24
brew link --force --overwrite node@24
```

2. Create a `.env` file in the project root and paste this:

```env
MISTRAL_API_KEY=""
OPENROUTER_API_KEY=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

Add your API keys between the quotes, then save the file.

3. Open a terminal in the project folder and run:

```bash
npm install
```

4. Start the app:

```bash
npm run app:dev
```

### Install

```bash
git clone https://github.com/ARISTO69/free-cluie.git
cd free-cluie
```

### Environment Variables

```env
MISTRAL_API_KEY=your_api_key_here
OPENROUTER_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
```

Optional Ollama configuration:

```env
USE_OLLAMA=true
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434
```

### Run

```bash
npm run app:dev
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

### OpenRouter

- OpenAI-compatible API access
- Flexible model selection

### Mistral

- OpenAI-compatible API access
- Strong general-purpose model support

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
