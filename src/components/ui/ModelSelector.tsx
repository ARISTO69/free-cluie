import React, { useEffect, useState } from "react";

type Provider = "ollama" | "gemini" | "openrouter" | "mistral";

interface ModelConfig {
  provider: Provider;
  model: string;
  isOllama: boolean;
}

interface SavedLlmSettings {
  provider: Provider;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  mistralApiKey?: string;
  mistralModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface ModelSelectorProps {
  onModelChange?: (provider: Provider, model: string) => void;
  onChatOpen?: () => void;
}

const DEFAULT_OPENROUTER_MODEL = "mistralai/mistral-large";
const DEFAULT_MISTRAL_MODEL = "mistral-large-latest";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, onChatOpen }) => {
  const [currentConfig, setCurrentConfig] = useState<ModelConfig | null>(null);
  const [savedSettings, setSavedSettings] = useState<SavedLlmSettings | null>(null);
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedProvider, setSelectedProvider] = useState<Provider>("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [openRouterModel, setOpenRouterModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [mistralModel, setMistralModel] = useState(DEFAULT_MISTRAL_MODEL);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const getProviderLabel = (provider: Provider) => {
    switch (provider) {
      case "ollama":
        return "Ollama";
      case "openrouter":
        return "OpenRouter";
      case "mistral":
        return "Mistral";
      default:
        return "Gemini";
    }
  };

  const getModelForProvider = (provider: Provider) => {
    switch (provider) {
      case "ollama":
        return selectedOllamaModel;
      case "openrouter":
        return openRouterModel;
      case "mistral":
        return mistralModel;
      default:
        return DEFAULT_GEMINI_MODEL;
    }
  };

  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const saved = await window.electronAPI.getSavedLlmSettings();
      const config = await window.electronAPI.getCurrentLlmConfig();
      setSavedSettings(saved);
      setCurrentConfig(config);
      setSelectedProvider(config.provider);

      if (saved?.geminiApiKey) {
        setGeminiApiKey(saved.geminiApiKey);
      }
      if (config.provider === "ollama") {
        setSelectedOllamaModel(config.model);
        await loadOllamaModels();
      }
      if (saved?.ollamaUrl) {
        setOllamaUrl(saved.ollamaUrl);
      }
      if (saved?.ollamaModel && config.provider !== "ollama") {
        setSelectedOllamaModel(saved.ollamaModel);
      }
      if (config.provider === "openrouter") {
        setOpenRouterModel(config.model);
      } else if (saved?.openRouterModel) {
        setOpenRouterModel(saved.openRouterModel);
      }
      if (saved?.openRouterApiKey) {
        setOpenRouterApiKey(saved.openRouterApiKey);
      }
      if (config.provider === "mistral") {
        setMistralModel(config.model);
      } else if (saved?.mistralModel) {
        setMistralModel(saved.mistralModel);
      }
      if (saved?.mistralApiKey) {
        setMistralApiKey(saved.mistralApiKey);
      }
    } catch (error) {
      console.error("Error loading current config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOllamaModels = async () => {
    try {
      const models = await window.electronAPI.getAvailableOllamaModels();
      setAvailableOllamaModels(models);
      if (models.length > 0 && !selectedOllamaModel) {
        setSelectedOllamaModel(models[0]);
      }
    } catch (error) {
      console.error("Error loading Ollama models:", error);
      setAvailableOllamaModels([]);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionStatus("testing");
      setErrorMessage("");
      const result = await window.electronAPI.testLlmConnection();
      setConnectionStatus(result.success ? "success" : "error");
      if (!result.success) {
        setErrorMessage(result.error || "Unknown error");
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(String(error));
    }
  };

  const handleProviderSwitch = async () => {
    try {
      setConnectionStatus("testing");
      setErrorMessage("");

      let result;
      if (selectedProvider === "ollama") {
        result = await window.electronAPI.switchToOllama(selectedOllamaModel, ollamaUrl);
      } else if (selectedProvider === "openrouter") {
        result = await window.electronAPI.switchToOpenRouter(openRouterApiKey || savedSettings?.openRouterApiKey || "", openRouterModel);
      } else if (selectedProvider === "mistral") {
        result = await window.electronAPI.switchToMistral(mistralApiKey || savedSettings?.mistralApiKey || "", mistralModel);
      } else {
        result = await window.electronAPI.switchToGemini(geminiApiKey || savedSettings?.geminiApiKey || undefined);
      }

      if (result.success) {
        await loadCurrentConfig();
        setConnectionStatus("success");
        onModelChange?.(selectedProvider, getModelForProvider(selectedProvider));
        setTimeout(() => {
          onChatOpen?.();
        }, 500);
      } else {
        setConnectionStatus("error");
        setErrorMessage(result.error || "Switch failed");
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(String(error));
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "testing":
        return "text-yellow-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "testing":
        return "Testing connection...";
      case "success":
        return "Connected successfully";
      case "error":
        return `Error: ${errorMessage}`;
      default:
        return "Ready";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
        <div className="animate-pulse text-sm text-gray-600">Loading model configuration...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AI Model Selection</h3>
        <div className={`text-xs ${getStatusColor()}`}>{getStatusText()}</div>
      </div>

      {currentConfig && (
        <div className="text-xs text-gray-600 bg-white/40 p-2 rounded">
          Current: {getProviderLabel(currentConfig.provider)} {currentConfig.model}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Provider</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedProvider("gemini")}
            className={`px-3 py-2 rounded text-xs transition-all ${
              selectedProvider === "gemini" ? "bg-blue-500 text-white shadow-md" : "bg-white/40 text-gray-700 hover:bg-white/60"
            }`}
          >
            Gemini
          </button>
          <button
            onClick={() => setSelectedProvider("ollama")}
            className={`px-3 py-2 rounded text-xs transition-all ${
              selectedProvider === "ollama" ? "bg-green-500 text-white shadow-md" : "bg-white/40 text-gray-700 hover:bg-white/60"
            }`}
          >
            Ollama
          </button>
          <button
            onClick={() => setSelectedProvider("openrouter")}
            className={`px-3 py-2 rounded text-xs transition-all ${
              selectedProvider === "openrouter" ? "bg-orange-500 text-white shadow-md" : "bg-white/40 text-gray-700 hover:bg-white/60"
            }`}
          >
            OpenRouter
          </button>
          <button
            onClick={() => setSelectedProvider("mistral")}
            className={`px-3 py-2 rounded text-xs transition-all ${
              selectedProvider === "mistral" ? "bg-rose-500 text-white shadow-md" : "bg-white/40 text-gray-700 hover:bg-white/60"
            }`}
          >
            Mistral
          </button>
        </div>
      </div>

      {selectedProvider === "gemini" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Gemini API Key (optional if already set)</label>
          <input
            type="password"
            placeholder="Enter API key to update..."
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </div>
      )}

      {selectedProvider === "ollama" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Ollama URL</label>
            <input
              type="url"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-green-400/60"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={loadOllamaModels}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                Refresh
              </button>
            </div>
            {availableOllamaModels.length > 0 ? (
              <select
                value={selectedOllamaModel}
                onChange={(e) => setSelectedOllamaModel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-green-400/60"
              >
                {availableOllamaModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-gray-600 bg-yellow-100/60 p-2 rounded">
                No Ollama models found. Make sure Ollama is running and models are installed.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProvider === "openrouter" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">OpenRouter API Key</label>
            <input
              type="password"
              placeholder="Enter OpenRouter API key..."
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Model</label>
            <input
              type="text"
              value={openRouterModel}
              onChange={(e) => setOpenRouterModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            />
          </div>
        </div>
      )}

      {selectedProvider === "mistral" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Mistral API Key</label>
            <input
              type="password"
              placeholder="Enter Mistral API key..."
              value={mistralApiKey}
              onChange={(e) => setMistralApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Model</label>
            <input
              type="text"
              value={mistralModel}
              onChange={(e) => setMistralModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleProviderSwitch}
          disabled={connectionStatus === "testing"}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs rounded transition-all shadow-md"
        >
          {connectionStatus === "testing" ? "Switching..." : "Apply Changes"}
        </button>
        <button
          onClick={testConnection}
          disabled={connectionStatus === "testing"}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-xs rounded transition-all shadow-md"
        >
          Test
        </button>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div><strong>Gemini:</strong> Fast, cloud-based, requires API key</div>
        <div><strong>Ollama:</strong> Private, local, requires Ollama installation</div>
        <div><strong>OpenRouter:</strong> OpenAI-compatible routing with provider/model choice</div>
        <div><strong>Mistral:</strong> Direct Mistral API access with Mistral models</div>
      </div>
    </div>
  );
};

export default ModelSelector;
