import React, { useEffect, useRef, useState } from "react";
import { UITheme } from "../../types/theme";

type Provider = "ollama" | "gemini" | "openai" | "openrouter" | "mistral" | "custom";

interface ModelConfig {
  provider: Provider;
  model: string;
  isOllama: boolean;
  customProviderName?: string;
  customBaseUrl?: string;
  customModel?: string;
}

interface SavedLlmSettings {
  provider: Provider;
  geminiApiKey?: string;
  geminiModel?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  mistralApiKey?: string;
  mistralModel?: string;
  customProviderName?: string;
  customBaseUrl?: string;
  customApiKey?: string;
  customModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  systemPrompt?: string;
  chatSystemPrompt?: string;
  practicalSystemPrompt?: string;
  systemPromptsEnabled?: boolean;
  deepgramApiKey?: string;
}

interface ProviderModel {
  id: string;
  name?: string;
}

interface ModelSelectorProps {
  onModelChange?: (provider: Provider, model: string) => void;
  onChatOpen?: () => void;
  uiTheme: UITheme;
  onThemeChange: (theme: UITheme) => void;
}

const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";
const DEFAULT_OPENAI_MODEL = "gpt-5-nano";
const DEFAULT_MISTRAL_MODEL = "mistral-large-latest";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange, onChatOpen, uiTheme, onThemeChange }) => {
  const [currentConfig, setCurrentConfig] = useState<ModelConfig | null>(null);
  const [savedSettings, setSavedSettings] = useState<SavedLlmSettings | null>(null);
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedProvider, setSelectedProvider] = useState<Provider>("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [customProviderName, setCustomProviderName] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL);
  const [openAiModel, setOpenAiModel] = useState(DEFAULT_OPENAI_MODEL);
  const [openRouterModel, setOpenRouterModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [mistralModel, setMistralModel] = useState(DEFAULT_MISTRAL_MODEL);
  const [customModel, setCustomModel] = useState("");
  const [chatSystemPrompt, setChatSystemPrompt] = useState("");
  const [practicalSystemPrompt, setPracticalSystemPrompt] = useState("");
  const [isSystemPromptEnabled, setIsSystemPromptEnabled] = useState(false);
  const [activeSystemPrompt, setActiveSystemPrompt] = useState<"chat" | "practical" | null>(null);
  const [systemPromptStatus, setSystemPromptStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deepgramApiKey, setDeepgramApiKey] = useState("");
  const [deepgramStatus, setDeepgramStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [availableModels, setAvailableModels] = useState<ProviderModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const getProviderLabel = (provider: Provider) => {
      switch (provider) {
        case "ollama":
          return "Ollama";
        case "openai":
          return "OpenAI";
        case "openrouter":
          return "OpenRouter";
        case "mistral":
          return "Mistral";
        case "custom":
          return customProviderName || savedSettings?.customProviderName || currentConfig?.customProviderName || "Custom";
        default:
          return "Gemini";
      }
  };

  const getModelForProvider = (provider: Provider) => {
    switch (provider) {
      case "ollama":
        return selectedOllamaModel;
      case "openai":
        return openAiModel;
      case "openrouter":
        return openRouterModel;
      case "mistral":
        return mistralModel;
      case "custom":
        return customModel;
      default:
        return geminiModel;
    }
  };

  const getApiKeyForProvider = (provider: Provider, saved?: SavedLlmSettings | null) => {
    if (provider === "gemini") return geminiApiKey || saved?.geminiApiKey;
    if (provider === "openai") return openAiApiKey || saved?.openAiApiKey;
    if (provider === "openrouter") return openRouterApiKey || saved?.openRouterApiKey;
    if (provider === "mistral") return mistralApiKey || saved?.mistralApiKey;
    if (provider === "custom") return customApiKey || saved?.customApiKey;
    return undefined;
  };

  const getBaseUrlForProvider = (provider: Provider, saved?: SavedLlmSettings | null) => {
    if (provider === "custom") return customBaseUrl || saved?.customBaseUrl;
    return undefined;
  };

  const selectDefaultModel = (provider: Provider, models: ProviderModel[]) => {
    if (models.length === 0) return;
    const ids = models.map((model) => model.id);

    if (provider === "gemini" && !ids.includes(geminiModel)) {
      setGeminiModel(ids.includes(DEFAULT_GEMINI_MODEL) ? DEFAULT_GEMINI_MODEL : ids[0]);
    }
    if (provider === "openai" && !ids.includes(openAiModel)) {
      setOpenAiModel(ids.includes(DEFAULT_OPENAI_MODEL) ? DEFAULT_OPENAI_MODEL : ids[0]);
    }
    if (provider === "openrouter" && !ids.includes(openRouterModel)) {
      setOpenRouterModel(ids.includes(DEFAULT_OPENROUTER_MODEL) ? DEFAULT_OPENROUTER_MODEL : ids[0]);
    }
    if (provider === "mistral" && !ids.includes(mistralModel)) {
      setMistralModel(ids.includes(DEFAULT_MISTRAL_MODEL) ? DEFAULT_MISTRAL_MODEL : ids[0]);
    }
    if (provider === "custom" && !ids.includes(customModel)) {
      setCustomModel(ids[0]);
    }
    if (provider === "ollama" && !ids.includes(selectedOllamaModel)) {
      setSelectedOllamaModel(ids[0]);
    }
  };

  const loadProviderModels = async (provider: Provider, saved?: SavedLlmSettings | null) => {
    try {
      setIsLoadingModels(true);
      const models = await window.electronAPI.getAvailableProviderModels(provider, {
        apiKey: getApiKeyForProvider(provider, saved),
        ollamaUrl: saved?.ollamaUrl || ollamaUrl,
        baseUrl: getBaseUrlForProvider(provider, saved)
      });
      setAvailableModels(models);
      selectDefaultModel(provider, models);
      if (provider === "ollama") {
        setAvailableOllamaModels(models.map((model) => model.id));
      }
    } catch (error) {
      console.error("Error loading provider models:", error);
      setAvailableModels([]);
      if (provider === "ollama") {
        setAvailableOllamaModels([]);
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setModelSearch("");
    setIsModelMenuOpen(false);
    loadProviderModels(provider, savedSettings);
  };

  const setModelForProvider = (provider: Provider, model: string) => {
    if (provider === "gemini") setGeminiModel(model);
    if (provider === "ollama") setSelectedOllamaModel(model);
    if (provider === "openai") setOpenAiModel(model);
    if (provider === "openrouter") setOpenRouterModel(model);
    if (provider === "mistral") setMistralModel(model);
    if (provider === "custom") setCustomModel(model);
    setModelSearch("");
    setIsModelMenuOpen(false);
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
      if (config.provider === "gemini") {
        setGeminiModel(config.model);
      } else if (saved?.geminiModel) {
        setGeminiModel(saved.geminiModel);
      }
      if (saved?.openAiApiKey) {
        setOpenAiApiKey(saved.openAiApiKey);
      }
      if (config.provider === "openai") {
        setOpenAiModel(config.model);
      } else if (saved?.openAiModel) {
        setOpenAiModel(saved.openAiModel);
      }
      if (config.provider === "ollama") {
        setSelectedOllamaModel(config.model);
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
      if (saved?.customProviderName) {
        setCustomProviderName(saved.customProviderName);
      }
      if (!saved?.customProviderName && config.customProviderName) {
        setCustomProviderName(config.customProviderName);
      }
      if (saved?.customBaseUrl) {
        setCustomBaseUrl(saved.customBaseUrl);
      }
      if (!saved?.customBaseUrl && config.customBaseUrl) {
        setCustomBaseUrl(config.customBaseUrl);
      }
      if (saved?.customApiKey) {
        setCustomApiKey(saved.customApiKey);
      }
      if (config.provider === "custom") {
        setCustomModel(saved?.customModel || config.customModel || config.model);
      } else if (saved?.customModel) {
        setCustomModel(saved.customModel);
      }
      const savedChatPrompt = saved?.chatSystemPrompt ?? saved?.systemPrompt ?? "";
      const savedPracticalPrompt = saved?.practicalSystemPrompt ?? saved?.systemPrompt ?? "";
      setChatSystemPrompt(savedChatPrompt);
      setPracticalSystemPrompt(savedPracticalPrompt);
      setIsSystemPromptEnabled(saved?.systemPromptsEnabled ?? Boolean(savedChatPrompt || savedPracticalPrompt));
      setDeepgramApiKey(saved?.deepgramApiKey || "");
      await loadProviderModels(config.provider, saved);
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
      setAvailableModels(models.map((id) => ({ id })));
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
      } else if (selectedProvider === "openai") {
        result = await window.electronAPI.switchToOpenAI(openAiApiKey || savedSettings?.openAiApiKey || "", openAiModel);
      } else if (selectedProvider === "openrouter") {
        result = await window.electronAPI.switchToOpenRouter(openRouterApiKey || savedSettings?.openRouterApiKey || "", openRouterModel);
      } else if (selectedProvider === "mistral") {
        result = await window.electronAPI.switchToMistral(mistralApiKey || savedSettings?.mistralApiKey || "", mistralModel);
      } else if (selectedProvider === "custom") {
        result = await window.electronAPI.switchToCustomProvider(
          customProviderName || savedSettings?.customProviderName || "Custom",
          customBaseUrl || savedSettings?.customBaseUrl || "",
          customApiKey || savedSettings?.customApiKey || "",
          customModel
        );
      } else {
        result = await window.electronAPI.switchToGemini(geminiApiKey || savedSettings?.geminiApiKey || undefined, geminiModel);
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

  const saveSystemPromptSettings = async (enabled: boolean) => {
    try {
      setSystemPromptStatus("saving");
      const result = await window.electronAPI.saveSystemPrompts({
        chatSystemPrompt,
        practicalSystemPrompt,
        enabled
      });
      if (result.success) {
        setSystemPromptStatus("saved");
        setSavedSettings((settings) => ({
          ...(settings || { provider: selectedProvider }),
          systemPrompt: chatSystemPrompt,
          chatSystemPrompt,
          practicalSystemPrompt,
          systemPromptsEnabled: enabled
        }));
      } else {
        setSystemPromptStatus("error");
        setErrorMessage(result.error || "Failed to save system prompt");
      }
    } catch (error) {
      setSystemPromptStatus("error");
      setErrorMessage(String(error));
    }
  };

  const handleSystemPromptSave = async () => {
    await saveSystemPromptSettings(isSystemPromptEnabled);
  };

  const handleDeepgramSave = async () => {
    try {
      setDeepgramStatus("saving");
      const result = await window.electronAPI.saveDeepgramApiKey(deepgramApiKey);
      if (result.success) {
        setDeepgramStatus("saved");
        setSavedSettings((settings) => ({
          ...(settings || { provider: selectedProvider }),
          deepgramApiKey
        }));
      } else {
        setDeepgramStatus("error");
        setErrorMessage(result.error || "Failed to save Deepgram API key");
      }
    } catch (error) {
      setDeepgramStatus("error");
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

  const modelOptions = availableModels.some((model) => model.id === getModelForProvider(selectedProvider))
    ? availableModels
    : getModelForProvider(selectedProvider)
      ? [{ id: getModelForProvider(selectedProvider) }, ...availableModels]
      : availableModels;

  const filteredModelOptions = modelSearch.trim()
    ? modelOptions.filter((model) => {
        const search = modelSearch.trim().toLowerCase();
        return (
          model.id.toLowerCase().includes(search) ||
          (model.name || "").toLowerCase().includes(search)
        );
      })
    : modelOptions;

  const getModelLabel = (modelId: string) => {
    const model = modelOptions.find((option) => option.id === modelId);
    if (!model) return modelId;
    return model.name && model.name !== model.id ? `${model.name} (${model.id})` : model.id;
  };

  const renderModelPicker = () => (
    <div className="relative mt-1" ref={modelMenuRef}>
      <button
        type="button"
        onClick={() => setIsModelMenuOpen((open) => !open)}
        className={`w-full px-3 py-2 text-xs border rounded text-left focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
          uiTheme === "dark"
            ? "bg-black/50 border-white/20 text-white"
            : "bg-white/40 border-white/60 text-gray-800"
        }`}
      >
        <span className="block truncate">{getModelLabel(getModelForProvider(selectedProvider))}</span>
      </button>

      {isModelMenuOpen && (
        <div
          className={`absolute z-50 mt-1 w-full rounded border shadow-lg backdrop-blur-md ${
            uiTheme === "dark"
              ? "border-white/20 bg-black/95"
              : "border-white/60 bg-white/95"
          }`}
        >
          <div className="p-2">
            <input
              type="search"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder={`Search ${getProviderLabel(selectedProvider)} models...`}
              className={`w-full px-3 py-2 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                uiTheme === "dark"
                  ? "bg-zinc-900 border-white/20 text-white placeholder:text-white/40"
                  : "bg-white border-gray-200 text-gray-800"
              }`}
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredModelOptions.length > 0 ? (
              filteredModelOptions.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setModelForProvider(selectedProvider, model.id)}
                  className={`w-full px-3 py-2 text-left text-xs ${
                    uiTheme === "dark"
                      ? model.id === getModelForProvider(selectedProvider)
                        ? "bg-white/15 text-white"
                        : "text-white/85 hover:bg-white/10"
                      : model.id === getModelForProvider(selectedProvider)
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-800 hover:bg-blue-50"
                  }`}
                >
                  <span className="block truncate">
                    {model.name && model.name !== model.id ? model.name : model.id}
                  </span>
                  {model.name && model.name !== model.id && (
                    <span className={`block truncate text-[10px] ${uiTheme === "dark" ? "text-white/50" : "text-gray-500"}`}>
                      {model.id}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className={`px-3 py-2 text-xs ${uiTheme === "dark" ? "text-white/50" : "text-gray-500"}`}>
                No matching models
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    );

  if (isLoading) {
    return (
      <div className="settings-panel p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
        <div className="animate-pulse text-sm text-gray-600">Loading model configuration...</div>
      </div>
    );
  }

  return (
    <div className="settings-panel p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Appearance</h3>
        <button
          type="button"
          onClick={() => onThemeChange(uiTheme === "dark" ? "translucent" : "dark")}
          className="flex w-full items-center justify-between rounded bg-white/40 px-3 py-2 text-xs text-gray-700 transition-all hover:bg-white/60"
          aria-pressed={uiTheme === "dark"}
        >
          <span>Dark mode</span>
          <span
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
              uiTheme === "dark" ? "bg-blue-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                uiTheme === "dark" ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AI Model Selection</h3>
        <div className={`text-xs ${getStatusColor()}`}>{getStatusText()}</div>
      </div>

      {currentConfig && (
        <div className="text-xs text-gray-600 bg-white/40 p-2 rounded">
          Current: {getProviderLabel(currentConfig.provider)} {currentConfig.model}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-gray-700">Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderSelect(e.target.value as Provider)}
          className="w-40 px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="ollama">Ollama</option>
          <option value="openrouter">OpenRouter</option>
          <option value="mistral">Mistral</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {selectedProvider === "gemini" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Gemini API Key (optional if already set)</label>
            <input
              type="password"
              placeholder="Enter API key to update..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={() => loadProviderModels("gemini", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
            {renderModelPicker()}
          </div>
        </div>
      )}

      {selectedProvider === "openai" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">OpenAI API Key</label>
            <input
              type="password"
              placeholder="Enter OpenAI API key..."
              value={openAiApiKey}
              onChange={(e) => setOpenAiApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={() => loadProviderModels("openai", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
            {renderModelPicker()}
          </div>
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
                onClick={() => loadProviderModels("ollama", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
            {modelOptions.length > 0 ? (
              renderModelPicker()
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
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={() => loadProviderModels("openrouter", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
            {renderModelPicker()}
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
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={() => loadProviderModels("mistral", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Refresh models"
              >
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
            {renderModelPicker()}
          </div>
        </div>
      )}

      {selectedProvider === "custom" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Provider Name</label>
            <input
              type="text"
              placeholder="Example: Local Studio, Groq, Fireworks"
              value={customProviderName}
              onChange={(e) => setCustomProviderName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Base URL</label>
            <input
              type="url"
              placeholder="https://api.your-llm.com/v1"
              value={customBaseUrl}
              onChange={(e) => setCustomBaseUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">API Key</label>
            <input
              type="password"
              placeholder="Enter provider API key..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Model</label>
              <button
                onClick={() => loadProviderModels("custom", savedSettings)}
                className="px-2 py-1 text-xs bg-white/60 hover:bg-white/80 rounded transition-all"
                title="Fetch models"
              >
                {isLoadingModels ? "Loading..." : "Fetch Models"}
              </button>
            </div>
            {modelOptions.length > 0 ? (
              renderModelPicker()
            ) : (
              <div className="text-xs text-gray-600 bg-yellow-100/60 p-2 rounded">
                Enter the provider details, then fetch models from the custom endpoint.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProvider !== "gemini" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium text-gray-700">Deepgram API Key</label>
            <span className="text-[10px] text-gray-600">
              {deepgramStatus === "saving"
                ? "Saving..."
                : deepgramStatus === "saved"
                  ? "Saved"
                  : deepgramStatus === "error"
                    ? "Save failed"
                    : "For microphone"}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter Deepgram API key..."
              value={deepgramApiKey}
              onChange={(e) => {
                setDeepgramApiKey(e.target.value);
                setDeepgramStatus("idle");
              }}
              className="min-w-0 flex-1 px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            />
            <button
              type="button"
              onClick={handleDeepgramSave}
              disabled={deepgramStatus === "saving"}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-xs rounded transition-all shadow-md"
            >
              Save
            </button>
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

      <div className="space-y-2 rounded border border-white/30 bg-white/20 p-3">
        <button
          type="button"
          onClick={() => {
            const nextEnabled = !isSystemPromptEnabled;
            setIsSystemPromptEnabled(nextEnabled);
            setActiveSystemPrompt(nextEnabled ? activeSystemPrompt || "chat" : null);
            saveSystemPromptSettings(nextEnabled);
          }}
          className="flex w-full items-center justify-between rounded bg-white/40 px-3 py-2 text-xs text-gray-700 transition-all hover:bg-white/60"
          aria-pressed={isSystemPromptEnabled}
        >
          <span className="font-medium">System prompt option</span>
          <span
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
              isSystemPromptEnabled ? "bg-blue-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isSystemPromptEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        {isSystemPromptEnabled && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveSystemPrompt(activeSystemPrompt === "chat" ? null : "chat")}
                className={`rounded px-3 py-2 text-[11px] transition-all ${
                  activeSystemPrompt === "chat"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/40 text-gray-700 hover:bg-white/60"
                }`}
                aria-expanded={activeSystemPrompt === "chat"}
              >
                System Prompt for Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveSystemPrompt(activeSystemPrompt === "practical" ? null : "practical")}
                className={`rounded px-3 py-2 text-[11px] transition-all ${
                  activeSystemPrompt === "practical"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/40 text-gray-700 hover:bg-white/60"
                }`}
                aria-expanded={activeSystemPrompt === "practical"}
              >
                System Prompt for Practical
              </button>
            </div>

            {activeSystemPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-medium text-gray-700">
                    {activeSystemPrompt === "chat" ? "Chat System Prompt" : "Practical System Prompt"}
                  </label>
                  <span className="text-[10px] text-gray-600">
                    {systemPromptStatus === "saving"
                      ? "Saving..."
                      : systemPromptStatus === "saved"
                        ? "Saved"
                        : systemPromptStatus === "error"
                          ? "Save failed"
                          : "Optional"}
                  </span>
                </div>
                <textarea
                  value={activeSystemPrompt === "chat" ? chatSystemPrompt : practicalSystemPrompt}
                  onChange={(e) => {
                    if (activeSystemPrompt === "chat") {
                      setChatSystemPrompt(e.target.value);
                    } else {
                      setPracticalSystemPrompt(e.target.value);
                    }
                    setSystemPromptStatus("idle");
                  }}
                  placeholder={
                    activeSystemPrompt === "chat"
                      ? "Example: Answer concisely, include assumptions, and ask clarifying questions only when required."
                      : "Example: Guide practical exam work step by step, continue from memory, and focus on the next experiment action."
                  }
                  className="w-full min-h-[92px] resize-y px-3 py-2 text-xs bg-white/40 border border-white/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                />
                <button
                  type="button"
                  onClick={handleSystemPromptSave}
                  disabled={systemPromptStatus === "saving"}
                  className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-xs rounded transition-all shadow-md"
                >
                  {systemPromptStatus === "saving" ? "Saving Prompts..." : "Save System Prompts"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ModelSelector;
