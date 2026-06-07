# CLAUDE.md

This file documents how to work with this codebase.

## Project Overview
This is Free Cluie, an open-source desktop AI assistant built with Electron and React. The project provides an AI assistant that runs locally and can be extended with various AI backends.

## Project Structure
```
src/
  - Main application code (App.tsx, components/, etc.)
electron/
  - Electron main process code (main.ts, LLMHelper.ts, ScreenshotHelper.ts, etc.)
```

## Key Components
1. **src/** - Contains the main React application components
2. **electron/** - Contains the Electron main process helpers and configuration

## Development Setup
1. Ensure Node.js 24.0.0 is installed
2. Install dependencies with `npm install`
3. Add your API keys to a `.env` file in the project root:
   ```env
   MISTRAL_API_KEY=your_api_key_here
   OPENROUTER_API_KEY=your_api_key_here
   GEMINI_API_KEY=your_api_key_here
   OPENAI_API_KEY=your_api_key_here
   NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key_here
   ```

## Running the Application
1. Development: `npm run app:dev`
2. Production: `npm run app:build`

## Project Customization
To customize this application:
1. Clone the repository
2. Set up your environment with API keys for your preferred AI service
3. Run the application with `npm run app:dev`

## Supported AI Backends
- Ollama for local inference
- OpenAI API
- Google Gemini API
- Mistral API
- OpenRouter API
- NVIDIA NIM API

## Adding NVIDIA NIM Model Support

To add support for NVIDIA NIM models:

1. Add your NVIDIA NIM API key to the `.env` file:
   ```env
   NVIDIA_NIM_API_KEY=your_nvidia_nim_api_key_here
   ```

2. Configure the application to use NVIDIA NIM models by setting the provider to "nvidia-nim" and specifying the base URL as `https://integrate.api.nvidia.com/v1`

3. The application will automatically use the OpenAI-compatible API format for NVIDIA NIM models, allowing you to use NVIDIA's powerful language models for your tasks.

## Building
`npm run dist` - Builds the project for the current platform

## Troubleshooting
- Ensure port 5180 is free for the development server
- If you hit install issues with Sharp, try reinstalling with recommended build flags
- If using Ollama, confirm the local server is running at `http://localhost:11434`
- For NVIDIA NIM models, ensure you have a valid API key from NVIDIA

## Community & Support
This project is intended to be forked, extended, and adapted. If you build on top of it, keep the code practical and make it useful for real users.

## Contact
For custom AI systems and business deployments, visit [www.envoyc.com](https://www.envoyc.com)