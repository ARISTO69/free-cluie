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
  - Custom OpenAI-compatible provider (used for NVIDIA NIM and similar)
  - Ollama for local/private usage

### Windows Setup

The Windows install scripts ship as `Windows Installation.rar` (extract with WinRAR, 7-Zip, or the built-in Windows extractor). They use `winget` (bundled with Windows 10 1809+ / Windows 11).

1. Clone the repo and open a terminal in the project folder.

```bash
git clone https://github.com/ARISTO69/free-cluie.git
cd free-cluie
```

2. Download `Windows Installation.rar` from the repo root, then extract it anywhere (for example, into the cloned repo so you get `free-cluie\Windows Installation\01-install-nodejs.bat`).

3. Open the extracted `Windows Installation\` folder and run the scripts in order. Double-click each one from Explorer, or invoke from a terminal:

```bat
01-install-nodejs.bat
02-create-env-and-install.bat
03-add-api-keys.bat
04-run-dev-server.bat
```

- `01-install-nodejs.bat` — installs Node.js 24.0.0 via `winget` (also adds it to your `PATH`).
- `02-create-env-and-install.bat` — asks for the path to your cloned repo (default: the parent of the install folder), creates a blank `.env` there, and runs `npm install`. If `.env` already exists, it asks before overwriting.
- `03-add-api-keys.bat` — asks for the repo path, then prompts you for each API key. Press `Enter` to skip any key you don't have.
- `04-run-dev-server.bat` — asks for the repo path, then starts the app in dev mode.

If you want a clean Node.js 24.0.0 reinstall first, run `00-install-nodejs-24-reinstall.bat` instead of `01-install-nodejs.bat`.

### Mac/Linux Setup

The Mac/Linux install scripts ship as `Mac-Linux Installation.rar` (extract with `unar`, The Unarchiver, or any tool that handles RAR). They use `nvm` (installed automatically if missing). They need `curl` available on `PATH` and bash 4+.

1. Clone the repo and open a terminal in the project folder.

```bash
git clone https://github.com/ARISTO69/free-cluie.git
cd free-cluie
```

2. Download `Mac-Linux Installation.rar` from the repo root, then extract it anywhere (for example, into the cloned repo so you get `free-cluie/Mac-Linux Installation/01-install-nodejs.sh`).

3. From the extracted `Mac-Linux Installation/` folder, run the scripts in order:

```bash
chmod +x 0*-*.sh
./01-install-nodejs.sh
./02-create-env-and-install.sh
./03-add-api-keys.sh
./04-run-dev-server.sh
```

- `01-install-nodejs.sh` — installs nvm (if needed) and Node.js 24.0.0.
- `02-create-env-and-install.sh` — asks for the path to your cloned repo (default: the parent of the install folder), creates a blank `.env` there, and runs `npm install`. If `.env` already exists, it asks before overwriting.
- `03-add-api-keys.sh` — asks for the repo path, then prompts you for each API key. Press `Enter` to skip any key you don't have.
- `04-run-dev-server.sh` — asks for the repo path, then starts the app in dev mode.

If you want a clean Node.js 24.0.0 reinstall first, run `./00-install-nodejs-24-reinstall.sh` instead of `./01-install-nodejs.sh`.

If you'd rather install Node.js manually, any Node.js `24.x` release works:

```bash
# nvm
nvm install 24
nvm use 24
nvm alias default 24

# Homebrew (macOS)
brew install node@24
brew link --force --overwrite node@24
```

### Install (no scripts)

If you prefer to set things up by hand:

```bash
git clone https://github.com/ARISTO69/free-cluie.git
cd free-cluie
```

Create a `.env` file in the project root with:

```env
MISTRAL_API_KEY=""
OPENROUTER_API_KEY=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
NVIDIA_NIM_API_KEY=""
```

Fill in any keys you have between the quotes and save. Then:

```bash
npm install
npm run app:dev
```

Any API keys you enter in the app are stored locally in your OS user data directory and are not committed to the repository.

### Environment Variables

```env
MISTRAL_API_KEY=your_api_key_here
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openrouter/auto
GEMINI_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
# Used when you wire NVIDIA NIM through the in-app Custom Provider
NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key_here
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
- Default router model: `openrouter/auto`

### Custom

- Bring your own OpenAI-compatible endpoint
- Save a provider name, base URL, key, and discovered model list locally

### NVIDIA NIM

- Add it from **Settings → Custom Provider**: set the provider name (e.g. `nvidia-nim`), paste your `NVIDIA_NIM_API_KEY`, and set the base URL to `https://integrate.api.nvidia.com/v1`
- The app uses the OpenAI-compatible API format, so any model NVIDIA exposes through NIM works
- Discoverable model list is populated once you save the provider

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
