import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/authContext";

const languageOptions = [
  {
    code: "en",
    name: "English",
    accents: [
      { code: "en-US", name: "American" },
      { code: "en-GB", name: "British" },
      { code: "en-AU", name: "Australian" },
      { code: "en-IN", name: "Indian" },
      { code: "en-SC", name: "Scottish" },
    ],
  },
  {
    code: "es",
    name: "Spanish",
    accents: [
      { code: "es-ES", name: "Spain" },
      { code: "es-MX", name: "Mexico" },
    ],
  },
  {
    code: "fr",
    name: "French",
    accents: [{ code: "fr-FR", name: "France" }],
  },
  {
    code: "de",
    name: "German",
    accents: [{ code: "de-DE", name: "Standard" }],
  },
  {
    code: "it",
    name: "Italian",
    accents: [{ code: "it-IT", name: "Standard" }],
  },
  {
    code: "pt",
    name: "Portuguese",
    accents: [{ code: "pt-BR", name: "Brazil" }],
  },
  {
    code: "hi",
    name: "Hindi",
    accents: [{ code: "hi-IN", name: "Standard" }],
  },
  {
    code: "zh",
    name: "Chinese",
    accents: [{ code: "zh-CN", name: "Mandarin" }],
  },
  {
    code: "ja",
    name: "Japanese",
    accents: [{ code: "ja-JP", name: "Standard" }],
  },
  {
    code: "ko",
    name: "Korean",
    accents: [{ code: "ko-KR", name: "Standard" }],
  },
  {
    code: "nl",
    name: "Dutch",
    accents: [{ code: "nl-NL", name: "Standard" }],
  },
  {
    code: "ro",
    name: "Romanian",
    accents: [{ code: "ro-RO", name: "Standard" }],
  },
  {
    code: "tr",
    name: "Turkish",
    accents: [{ code: "tr-TR", name: "Standard" }],
  },
  {
    code: "id",
    name: "Indonesian",
    accents: [{ code: "id-ID", name: "Standard" }],
  },
  {
    code: "bn",
    name: "Bengali",
    accents: [{ code: "bn-BD", name: "Standard" }],
  },
  {
    code: "pl",
    name: "Polish",
    accents: [{ code: "pl-PL", name: "Standard" }],
  },
  {
    code: "ta",
    name: "Tamil",
    accents: [{ code: "ta-IN", name: "Standard" }],
  },
];

const SignInPrompt = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
      <div className="flex flex-col items-center gap-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md text-center">
        <div className="text-6xl">🤖</div>
        <h2 className="text-2xl font-bold text-orange-400">
          Persona Customization
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          You need to sign in to customize your chatbot personas and voice
          settings.
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Please go to the Profile section to sign in or create an account.
        </p>
        <div className="flex items-center gap-2 text-orange-400 text-sm">
          <span>🎭</span>
          <span>Personalized AI experience</span>
        </div>
      </div>
    </div>
  );
};

const CreatePersonaModal = ({ isOpen, onClose, onCreate }) => {
  const { session } = useAuth();
  const token = session?.access_token;

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "🤖",
    customPrompt: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.customPrompt.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/personas/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            icon: form.icon,
            custom_prompt: form.customPrompt,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create persona");
      }

      const createdPersona = await response.json();

      // Transform API response to match frontend format
      const frontendPersona = {
        id: createdPersona.id,
        user_id: createdPersona.user_id,
        name: createdPersona.name,
        description: createdPersona.description,
        icon: createdPersona.icon,
        custom_prompt: createdPersona.custom_prompt,
        knowledge_base: createdPersona.knowledge_base,
        language: createdPersona.language,
        accent: createdPersona.accent,
        created_at: createdPersona.created_at,
        updated_at: createdPersona.updated_at,
        source: "user",
        is_default: false,
        isActive: false, // New personas are not active by default
      };

      onCreate(frontendPersona);
      setForm({ name: "", description: "", icon: "🤖", customPrompt: "" });
      onClose();
    } catch (error) {
      console.error("Error creating persona:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-white/20 max-w-lg w-full">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
          Create New Persona
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Enter persona name"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Brief description (optional)"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Icon
            </label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Choose an emoji"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Custom Prompt *
            </label>
            <textarea
              value={form.customPrompt}
              onChange={(e) =>
                setForm({ ...form, customPrompt: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Define how this persona should behave and respond..."
              rows={4}
              required
              disabled={isCreating}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Note: The prompt cannot be changed after creation
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30 rounded-lg p-3 text-center text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isCreating}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isCreating
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {isCreating ? "Creating..." : "Create Persona"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 px-4 py-2 rounded-lg bg-neutral-500 text-white hover:bg-neutral-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PersonaList = ({
  personas,
  onSelect,
  onCreateNew,
  onToggleActive,
  onDeactivatePersona,
  toggleLoading,
  deactivateLoading,
  knowledgeBases,
  mcpServers,
}) => {
  const activePersona = personas.find((p) => p.isActive);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Your Personas
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm mt-1">
            Choose from default personas or create your own custom AI assistant
            personalities
          </p>
          {activePersona ? (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-orange-400">Currently Active:</span>
              <span className="text-black dark:text-white font-medium">
                {activePersona.name}
              </span>
              <span>{activePersona.icon}</span>
              <button
                onClick={onDeactivatePersona}
                disabled={deactivateLoading}
                className={`ml-2 px-2 py-1 text-xs rounded-md border transition-colors ${
                  deactivateLoading
                    ? "bg-neutral-400 text-white cursor-not-allowed"
                    : "border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                }`}
              >
                {deactivateLoading ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">
                Using Default Persona (No Custom Active)
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
        >
          <span>➕</span>
          Create Persona
        </button>
      </div>

      {/* Unified Personas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className={`bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border transition-all duration-200 hover:shadow-xl group ${
              persona.isActive
                ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10 ring-2 ring-orange-400/20"
                : "border-neutral-200 dark:border-white/20 hover:border-orange-400"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{persona.icon}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleActive(persona.id, persona.is_default);
                  }}
                  disabled={toggleLoading === persona.id || deactivateLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    toggleLoading === persona.id || deactivateLoading
                      ? "bg-neutral-400 cursor-not-allowed"
                      : persona.isActive
                      ? "bg-orange-500"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      toggleLoading === persona.id
                        ? "animate-pulse"
                        : persona.isActive
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                {toggleLoading === persona.id && (
                  <div className="text-xs text-orange-400 animate-pulse">
                    Activating...
                  </div>
                )}
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {persona.created_at?.split("T")[0]}
                </div>
              </div>
            </div>

            <h3
              className={`text-lg font-semibold mb-2 transition-colors ${
                persona.isActive
                  ? "text-orange-400"
                  : "text-black dark:text-white group-hover:text-orange-400"
              }`}
            >
              {persona.name}
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">
              {persona.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>📚</span>
                <span>
                  {persona.knowledge_base === "none" || !persona.knowledge_base
                    ? persona.is_default
                      ? "Preset"
                      : "None"
                    : knowledgeBases.find(
                        (kb) => kb.id === persona.knowledge_base
                      )?.name || persona.knowledge_base}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🔧</span>
                <span>
                  {persona.mcp_server
                    ? mcpServers.find((server) => server.id === persona.mcp_server)?.name || "Unknown Server"
                    : "None"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🌍</span>
                <span>
                  {languageOptions.find((l) => l.code === persona.language)
                    ?.name || "English"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🗣️</span>
                <span>
                  {languageOptions
                    .find((l) => l.code === persona.language)
                    ?.accents.find((a) => a.code === persona.accent)?.name ||
                    "Indian"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    persona.isActive
                      ? "bg-orange-500/20 text-orange-600 dark:text-orange-300 font-medium"
                      : "bg-neutral-500/20 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {persona.isActive ? "● Active" : "○ Inactive"}
                </div>
                {persona.is_default && (
                  <div className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                    Default
                  </div>
                )}
              </div>

              {/* Only show Configure button for custom personas */}
              {!persona.is_default && (
                <button
                  onClick={() => onSelect(persona)}
                  disabled={toggleLoading === persona.id || deactivateLoading}
                  className={`text-sm transition-all hover:scale-105 ${
                    toggleLoading === persona.id || deactivateLoading
                      ? "text-neutral-400 cursor-not-allowed"
                      : persona.isActive
                      ? "text-orange-400 hover:text-orange-300"
                      : "text-orange-400 opacity-0 group-hover:opacity-100 hover:text-orange-300"
                  }`}
                >
                  Configure →
                </button>
              )}

              {/* Show read-only indicator for default personas */}
              {persona.is_default && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                  Read-only
                </div>
              )}
            </div>
          </div>
        ))}

        {personas.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
              No Personas Available
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Create your first custom persona to get started.
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              Create Persona
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PersonaDetail = ({
  persona,
  onBack,
  onUpdatePersona,
  knowledgeBases,
  loadingKBs,
  mcpServers,
  loadingMCPs,
}) => {
  const { session } = useAuth();
  const token = session?.access_token;

  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(
    persona.knowledge_base || persona.knowledgeBase
  );
  const [selectedMCPServer, setSelectedMCPServer] = useState(
    persona.mcp_server || null
  );
  const [selectedLanguage, setSelectedLanguage] = useState(persona.language);
  const [selectedAccent, setSelectedAccent] = useState(persona.accent);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testText, setTestText] = useState(
    "Hello! This is a voice test. How do you like my voice?"
  );
  const [voiceTestStatus, setVoiceTestStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef();

  // Track original values to detect changes
  const originalValues = {
    knowledge_base: persona.knowledge_base || persona.knowledgeBase,
    mcp_server: persona.mcp_server || null,
    language: persona.language,
    accent: persona.accent,
  };

  const currentLanguage = languageOptions.find(
    (lang) => lang.code === selectedLanguage
  );
  const availableAccents = currentLanguage ? currentLanguage.accents : [];

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    const lang = languageOptions.find((l) => l.code === langCode);
    if (lang && lang.accents.length > 0) {
      setSelectedAccent(lang.accents[0].code);
    }
  };

  // Handle MCP server selection (single selection)
  const handleMCPServerSelect = (serverId) => {
    setSelectedMCPServer(serverId === selectedMCPServer ? null : serverId);
  };

  // Get sample text for different languages
  const getSampleTextForLanguage = (langCode) => {
    const sampleTexts = {
      "en-US": "Hello! This is a voice test. How do you like my voice?",
      "en-GB": "Hello! This is a voice test. How do you like my voice?",
      "en-AU": "G'day! This is a voice test. How do you like my voice?",
      "en-IN": "Hello! This is a voice test. How do you like my voice?",
      "en-SC": "Hello! This is a voice test. How do you like my voice?",
      "es-ES": "¡Hola! Esta es una prueba de voz. ¿Cómo te gusta mi voz?",
      "es-MX": "¡Hola! Esta es una prueba de voz. ¿Cómo te gusta mi voz?",
      "fr-FR": "Bonjour! Ceci est un test vocal. Comment aimez-vous ma voix?",
      "fr-CA": "Bonjour! Ceci est un test vocal. Comment aimez-vous ma voix?",
      "de-DE": "Hallo! Das ist ein Stimmtest. Wie gefällt dir meine Stimme?",
      "it-IT": "Ciao! Questo è un test vocale. Come ti piace la mia voce?",
      "pt-BR": "Olá! Este é um teste de voz. Como você gosta da minha voz?",
      "pt-PT": "Olá! Este é um teste de voz. Como gosta da minha voz?",
      "ru-RU": "Привет! Это голосовой тест. Как вам нравится мой голос?",
      "ar-SA": "مرحبا! هذا اختبار صوتي. كيف يعجبك صوتي؟",
      "hi-IN": "नमस्ते! यह एक आवाज़ परीक्षण है। आपको मेरी आवाज़ कैसी लगती है?",
      "zh-CN": "你好！这是语音测试。你喜欢我的声音吗？",
      "zh-HK": "你好！這是語音測試。你喜歡我的聲音嗎？",
      "ja-JP": "こんにちは！これは音声テストです。私の声はいかがですか？",
      "ko-KR": "안녕하세요! 음성 테스트입니다. 제 목소리가 어떠신가요?",
      "nl-NL": "Hallo! Dit is een stemtest. Hoe vind je mijn stem?",
      "da-DK": "Hej! Dette er en stemmetest. Hvordan kan du lide min stemme?",
      "fi-FI": "Hei! Tämä on äänitesti. Miltä ääneni kuulostaa?",
      "no-NO": "Hei! Dette er en stemmetest. Hvordan liker du stemmen min?",
      "ro-RO": "Salut! Acesta este un test vocal. Cum îți place vocea mea?",
      "tr-TR": "Merhaba! Bu bir ses testidir. Sesimi nasıl buluyorsun?",
      "id-ID": "Halo! Ini adalah tes suara. Bagaimana menurut Anda suara saya?",
      "bn-BD": "হ্যালো! এটি একটি ভয়েস টেস্ট। আমার কণ্ঠস্বর কেমন লাগছে?",
      "pl-PL": "Cześć! To jest test głosu. Jak ci się podoba mój głos?",
      "ta-IN":
        "வணக்கம்! இது ஒரு குரல் சோதனை. என் குரல் உங்களுக்கு எப்படி இருக்கிறது?",
    };

    return sampleTexts[langCode] || sampleTexts["en-US"];
  };

  // Update test text when accent changes
  const handleAccentChange = (accentCode) => {
    setSelectedAccent(accentCode);
    setTestText(getSampleTextForLanguage(accentCode));
  };

  const testVoice = async () => {
    if (!testText.trim()) {
      setVoiceTestStatus("Please enter some text to test");
      return;
    }

    setIsTestingVoice(true);
    setVoiceTestStatus("Generating voice sample...");

    try {
      // Use the new API endpoint with query parameters
      const encodedText = encodeURIComponent(testText);
      const endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/test_voice?text=${encodedText}&lang_code=${selectedAccent}`;

      console.log(`🔊 Testing voice with lang_code: ${selectedAccent}`);
      console.log(`🔊 Test text: "${testText}"`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        let errorMessage = `Voice test failed: ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the status
        }
        console.error("❌ Voice test failed:", errorMessage);
        throw new Error(errorMessage);
      }

      // Check if response is actually audio
      const contentType = response.headers.get("content-type");
      console.log("📡 Response content-type:", contentType);

      if (!contentType || !contentType.includes("audio/")) {
        console.warn("⚠️ Expected audio response but got:", contentType);
        throw new Error("Server returned non-audio response");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("✅ Audio blob created, size:", audioBlob.size, "bytes");

      if (audioRef.current) {
        audioRef.current.src = audioUrl;

        // Add event listeners for better UX
        audioRef.current.onloadstart = () => {
          setVoiceTestStatus("Loading audio...");
        };

        audioRef.current.oncanplaythrough = () => {
          setVoiceTestStatus("Playing voice sample...");
        };

        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setVoiceTestStatus("Voice sample completed ✨");
          setTimeout(() => setVoiceTestStatus(""), 2000);
        };

        audioRef.current.onerror = (e) => {
          console.error("❌ Audio playback error:", e);
          URL.revokeObjectURL(audioUrl);
          setVoiceTestStatus("Error playing audio");
        };

        // Start playing
        try {
          await audioRef.current.play();
        } catch (playError) {
          console.error("❌ Audio play error:", playError);
          setVoiceTestStatus("Error: Could not play audio");
        }
      }
    } catch (error) {
      console.error("❌ Voice test error:", error);
      setVoiceTestStatus(`Error: ${error.message}`);
    } finally {
      setIsTestingVoice(false);
      // Clear status after delay if not playing
      setTimeout(() => {
        if (
          !voiceTestStatus.includes("Playing") &&
          !voiceTestStatus.includes("completed") &&
          !voiceTestStatus.includes("Loading")
        ) {
          setVoiceTestStatus("");
        }
      }, 5000);
    }
  };

  // Updated saveSettings function with new API
  const saveSettings = async () => {
    setIsSaving(true);
    setVoiceTestStatus("Saving settings...");

    try {
      // Build update payload with only changed fields
      const updates = {};

      if (selectedKnowledgeBase !== originalValues.knowledge_base) {
        updates.knowledge_base = selectedKnowledgeBase;
      }

      // Check if MCP server has changed
      const originalMCPServer = originalValues.mcp_server || null;
      const mcpServerChanged = selectedMCPServer !== originalMCPServer;

      if (mcpServerChanged) {
        updates.mcp_server = selectedMCPServer;
      }

      if (selectedLanguage !== originalValues.language) {
        updates.language = selectedLanguage;
      }

      if (selectedAccent !== originalValues.accent) {
        updates.accent = selectedAccent;
      }

      // Check if there are any changes to save
      if (Object.keys(updates).length === 0) {
        setVoiceTestStatus("No changes to save");
        setTimeout(() => setVoiceTestStatus(""), 3000);
        return;
      }

      console.log("🔧 Updating persona with changes:", updates);

      const endpoint = `${import.meta.env.VITE_BACKEND_URL}/personas/${
        persona.id
      }`;

      const response = await fetch(endpoint, {
        method: "POST", // Changed from PUT to POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to update persona:", errorData);
        throw new Error(errorData.detail || "Failed to save settings");
      }

      const responseData = await response.json();
      console.log("✅ Persona update response:", responseData);

      // Handle the new API response structure
      if (responseData.success && responseData.persona) {
        const updatedPersonaData = responseData.persona;

        const frontendPersona = {
          ...persona,
          knowledge_base: updatedPersonaData.knowledge_base,
          mcp_server: updatedPersonaData.mcp_server,
          language: updatedPersonaData.language,
          accent: updatedPersonaData.accent,
          updated_at: updatedPersonaData.updated_at,
        };

        onUpdatePersona(frontendPersona);

        // Show which fields were updated
        const updatedFields =
          responseData.updated_fields || Object.keys(updates);
        setVoiceTestStatus(
          `Settings saved successfully! Updated: ${updatedFields.join(", ")}`
        );
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("❌ Error saving settings:", error);

      // Handle specific error cases
      if (error.message.includes("No valid fields")) {
        setVoiceTestStatus("Error: No valid fields provided for update");
      } else if (error.message.includes("not found")) {
        setVoiceTestStatus("Error: Persona not found or access denied");
      } else {
        setVoiceTestStatus(`Error: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setVoiceTestStatus(""), 5000);
    }
  };

  const resetSettings = () => {
    setSelectedKnowledgeBase(originalValues.knowledge_base);
    setSelectedMCPServer(originalValues.mcp_server || null);
    setSelectedLanguage(originalValues.language);
    setSelectedAccent(originalValues.accent);
    setTestText(getSampleTextForLanguage(originalValues.accent));
    setVoiceTestStatus("Settings reset to original values");
    setTimeout(() => setVoiceTestStatus(""), 3000);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    const originalMCPServer = originalValues.mcp_server || null;
    const mcpServerChanged = selectedMCPServer !== originalMCPServer;

    return (
      selectedKnowledgeBase !== originalValues.knowledge_base ||
      mcpServerChanged ||
      selectedLanguage !== originalValues.language ||
      selectedAccent !== originalValues.accent
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 transition-colors"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{persona.icon}</div>
          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              {persona.name}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm">
              {persona.description}
            </p>
            {persona.isActive && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="inline-block w-2 h-2 bg-orange-400 rounded-full"></span>
                <span className="text-orange-400 font-medium">
                  Currently Active
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-blue-400 text-xs">Custom Persona</span>
              {hasUnsavedChanges() && (
                <span className="text-yellow-400 text-xs">
                  ● Unsaved Changes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-8">
        {/* Persona Prompt (Read-only) */}
        <div className="xl:col-span-3 lg:col-span-2 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <span>🎭</span>
            Persona Prompt
          </h2>
          <div className="bg-white/10 dark:bg-white/10 rounded-lg p-4 border border-neutral-200 dark:border-white/20">
            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
              {persona.custom_prompt}
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Persona prompts cannot be modified after creation
          </p>
        </div>

        {/* Knowledge Base Selection */}
        <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <span>📚</span>
            Knowledge Base
          </h2>

          {loadingKBs ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-neutral-500 dark:text-neutral-400">
                Loading knowledge bases...
              </div>
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-neutral-500 dark:text-neutral-400 mb-2">
                No knowledge bases available
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500">
                Create knowledge bases in the Knowledge Base section
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* None option */}
              <button
                onClick={() => setSelectedKnowledgeBase("none")}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedKnowledgeBase === "none"
                    ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10"
                    : "border-neutral-200 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-black dark:text-white">
                    None
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    No specific knowledge base
                  </div>
                </div>
                {selectedKnowledgeBase === "none" && (
                  <span className="text-orange-400">✓</span>
                )}
              </button>

              {/* Knowledge base options */}
              {knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => setSelectedKnowledgeBase(kb.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedKnowledgeBase === kb.id
                      ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10"
                      : "border-neutral-200 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-black dark:text-white">
                      {kb.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Knowledge base
                    </div>
                  </div>
                  {selectedKnowledgeBase === kb.id && (
                    <span className="text-orange-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MCP Servers Selection */}
        <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <span>🔌</span>
            MCP Server
          </h2>

          {loadingMCPs ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-neutral-500 dark:text-neutral-400">
                Loading MCP servers...
              </div>
            </div>
          ) : mcpServers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-neutral-500 dark:text-neutral-400 mb-2">
                No MCP servers available
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500">
                Create MCP servers in the MCP Servers section
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                Select one MCP server to enhance your persona's capabilities:
              </div>
              
              {/* None option */}
              <button
                onClick={() => handleMCPServerSelect(null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedMCPServer === null
                    ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10"
                    : "border-neutral-200 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-black dark:text-white">
                    None
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    No MCP server
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  selectedMCPServer === null
                    ? "border-orange-400 bg-orange-400"
                    : "border-neutral-300 dark:border-neutral-600"
                }`}>
                  {selectedMCPServer === null && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
              
              {/* MCP server options */}
              {mcpServers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => handleMCPServerSelect(server.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedMCPServer === server.id
                      ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10"
                      : "border-neutral-200 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="text-left flex-1">
                    <div className="font-medium text-black dark:text-white">
                      {server.name || server.id}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {server.description || 'MCP Server'}
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    selectedMCPServer === server.id
                      ? "border-orange-400 bg-orange-400"
                      : "border-neutral-300 dark:border-neutral-600"
                  }`}>
                    {selectedMCPServer === server.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Settings */}
        <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <span>🗣️</span>
            Voice & Language
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {languageOptions.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-white dark:bg-gray-800"
                  >
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Accent/Variant
              </label>
              <select
                value={selectedAccent}
                onChange={(e) => handleAccentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {availableAccents.map((accent) => (
                  <option
                    key={accent.code}
                    value={accent.code}
                    className="bg-white dark:bg-gray-800"
                  >
                    {accent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Testing Section */}
            <div className="pt-4 border-t border-neutral-200 dark:border-white/20">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                Test Voice
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
                rows={3}
                placeholder="Enter text to test the voice..."
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Text automatically updates when you change the accent
              </p>

              <button
                onClick={testVoice}
                disabled={isTestingVoice}
                className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition-all ${
                  isTestingVoice
                    ? "bg-neutral-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {isTestingVoice ? "Testing..." : "🔊 Test Voice"}
              </button>

              {voiceTestStatus && (
                <div
                  className={`mt-3 p-3 rounded-lg text-center text-sm ${
                    voiceTestStatus.includes("successfully") ||
                    voiceTestStatus.includes("Playing") ||
                    voiceTestStatus.includes("completed")
                      ? "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30"
                      : voiceTestStatus.includes("Error") ||
                        voiceTestStatus.includes("failed")
                      ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30"
                      : "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {voiceTestStatus}
                </div>
              )}

              <audio ref={audioRef} className="hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={saveSettings}
          disabled={isSaving || !hasUnsavedChanges()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSaving
              ? "bg-neutral-400 cursor-not-allowed"
              : !hasUnsavedChanges()
              ? "bg-neutral-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {isSaving
            ? "Saving..."
            : hasUnsavedChanges()
            ? "💾 Save Changes"
            : "💾 No Changes"}
        </button>
        <button
          onClick={resetSettings}
          disabled={!hasUnsavedChanges()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !hasUnsavedChanges()
              ? "bg-neutral-400 cursor-not-allowed text-neutral-300"
              : "bg-neutral-500 text-white hover:bg-neutral-600"
          }`}
        >
          🔄 Reset Changes
        </button>
      </div>
    </div>
  );
};

const ChatbotCustomization = () => {
  const { user, isSignedIn, loading, session } = useAuth();
  const token = session?.access_token;

  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Knowledge Bases state
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loadingKBs, setLoadingKBs] = useState(true);
  const [kbError, setKbError] = useState(null);

  // MCP Servers state
  const [mcpServers, setMcpServers] = useState([]);
  const [loadingMCPs, setLoadingMCPs] = useState(true);
  const [mcpError, setMcpError] = useState(null);

  // Fetch knowledge bases from API
  const fetchKnowledgeBases = async () => {
    if (!isSignedIn || !token) return;

    try {
      setLoadingKBs(true);
      setKbError(null);

      console.log("🔍 Fetching knowledge bases for persona customization...");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/knowledge_bases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ KB API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Knowledge bases response:", data);

      // Transform API response to match UI expectations
      const transformedKBs = data.knowledge_bases.map((name, index) => ({
        id: name, // Use the name as ID since API only returns names
        name: name,
        description: "", // API doesn't provide description
        docCount: 0, // API doesn't provide doc count
      }));

      setKnowledgeBases(transformedKBs);
      console.log(
        `✅ Loaded ${data.total_count} knowledge bases for persona selection`
      );
    } catch (error) {
      console.error("❌ Error fetching knowledge bases:", error);
      setKbError(error.message);
      setKnowledgeBases([]); // Set empty array on error
    } finally {
      setLoadingKBs(false);
    }
  };

  // Fetch MCP servers from API
  const fetchMcpServers = async () => {
    if (!isSignedIn || !token) return;

    try {
      setLoadingMCPs(true);
      setMcpError(null);

      console.log("🔍 Fetching MCP servers for persona customization...");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/mcps`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ MCP API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ MCP servers response:", data);

      // Handle the API response format: { "user_id": "...", "servers": [...] }
      const serversList = data.servers || [];
      
      // Transform API response to match UI expectations
      const transformedMCPs = serversList.map((server) => ({
        id: server.id,
        name: server.name,
        description: `MCP Server • ${server.status || 'active'}`,
        url: server.url,
        bearerToken: server.bearerToken,
        created: server.created,
        status: server.status,
      }));

      setMcpServers(transformedMCPs);
      console.log(
        `✅ Loaded ${transformedMCPs.length} MCP servers for persona selection`
      );
    } catch (error) {
      console.error("❌ Error fetching MCP servers:", error);
      setMcpError(error.message);
      setMcpServers([]); // Set empty array on error
    } finally {
      setLoadingMCPs(false);
    }
  };

  // Load all data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isSignedIn || !token) return;

      try {
        console.log("🔍 Fetching personas...");

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/personas/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        const transformedPersonas = data.personas.map((persona) => ({
          ...persona,
          isActive: persona.is_active,
        }));

        setPersonas(transformedPersonas);
        console.log(
          `✅ Loaded ${data.total} personas (${data.default_count} default, ${data.user_count} custom)`
        );
      } catch (error) {
        console.error("❌ Error fetching personas:", error);
        setPersonas([]);
      } finally {
        setLoadingPersonas(false);
      }
    };

    if (isSignedIn && token) {
      fetchData();
      fetchKnowledgeBases(); // Fetch knowledge bases as well
      fetchMcpServers(); // Fetch MCP servers as well
    } else {
      setPersonas([]);
      setKnowledgeBases([]);
      setMcpServers([]);
      setLoadingPersonas(false);
      setLoadingKBs(false);
      setLoadingMCPs(false);
    }
  }, [isSignedIn, token]);

  // Show loading state
  if (loading || loadingPersonas) {
    return (
      <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">⏳</div>
          <div className="text-xl text-neutral-600 dark:text-neutral-300">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not signed in
  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  const handleCreatePersona = (newPersona) => {
    setPersonas([...personas, newPersona]);
  };

  const handleUpdatePersona = (updatedPersona) => {
    setPersonas((prev) =>
      prev.map((persona) =>
        persona.id === updatedPersona.id ? updatedPersona : persona
      )
    );
    setSelectedPersona(updatedPersona);
  };

  // Updated handleSelectPersona to only allow custom personas
  const handleSelectPersona = (persona) => {
    if (persona.is_default) {
      // Show a message that default personas can't be configured
      alert(
        "Default personas cannot be configured. Only custom personas can be modified."
      );
      return;
    }
    setSelectedPersona(persona);
  };

  const handleToggleActive = async (personaId, isDefault = false) => {
    // Prevent multiple simultaneous toggles
    if (toggleLoading || deactivateLoading) return;

    setToggleLoading(personaId);

    // Store original state for rollback on error
    const originalPersonas = [...personas];

    // Optimistically update UI first (for better UX)
    setPersonas((prev) =>
      prev.map((persona) => ({
        ...persona,
        isActive: persona.id === personaId,
      }))
    );

    try {
      const endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/personas/${personaId}/activate`;

      console.log(
        `🔄 Activating persona ${personaId} (${isDefault ? "default" : "user"})`
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          persona_source: isDefault ? "default" : "user",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to activate persona:", errorData);
        throw new Error(
          errorData.detail ||
            `Failed to activate persona: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("✅ Persona activation response:", responseData);
      console.log(
        `✅ Successfully activated persona ${responseData.active_persona_id}`
      );

      // Update selectedPersona if it's currently viewed
      if (selectedPersona && selectedPersona.id === personaId) {
        setSelectedPersona((prev) => ({ ...prev, isActive: true }));
      }
    } catch (error) {
      console.error("❌ Error activating persona:", error);

      // Rollback optimistic update on error
      setPersonas(originalPersonas);

      // Show user-friendly error message
      alert(`Failed to activate persona: ${error.message}`);
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDeactivatePersona = async () => {
    if (toggleLoading || deactivateLoading) return;

    setDeactivateLoading(true);

    // Store original state for rollback on error
    const originalPersonas = [...personas];

    // Optimistically update UI - deactivate all personas
    setPersonas((prev) =>
      prev.map((persona) => ({
        ...persona,
        isActive: false,
      }))
    );

    try {
      const endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/personas/deactivate`;

      console.log("🔄 Deactivating active persona...");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to deactivate persona:", errorData);
        throw new Error(
          errorData.detail ||
            `Failed to deactivate persona: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("✅ Persona deactivation response:", responseData);
      console.log(
        `✅ Successfully deactivated persona, falling back to default`
      );

      // Update selectedPersona if it's currently viewed
      if (selectedPersona) {
        setSelectedPersona((prev) => ({ ...prev, isActive: false }));
      }
    } catch (error) {
      console.error("❌ Error deactivating persona:", error);

      // Rollback optimistic update on error
      setPersonas(originalPersonas);

      // Show user-friendly error message
      if (error.message.includes("No active persona found")) {
        alert("No active persona to deactivate.");
      } else {
        alert(`Failed to deactivate persona: ${error.message}`);
      }
    } finally {
      setDeactivateLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col text-neutral-700 dark:text-white p-8 overflow-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Persona Customization
        </h1>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span>👋</span>
          <span>Welcome, {user.name}!</span>
        </div>
      </div>

      {selectedPersona ? (
        <PersonaDetail
          persona={selectedPersona}
          onBack={() => setSelectedPersona(null)}
          onUpdatePersona={handleUpdatePersona}
          knowledgeBases={knowledgeBases}
          loadingKBs={loadingKBs}
          mcpServers={mcpServers}
          loadingMCPs={loadingMCPs}
        />
      ) : (
        <PersonaList
          personas={personas}
          onSelect={handleSelectPersona}
          onCreateNew={() => setShowCreateModal(true)}
          onToggleActive={handleToggleActive}
          onDeactivatePersona={handleDeactivatePersona}
          toggleLoading={toggleLoading}
          deactivateLoading={deactivateLoading}
          knowledgeBases={knowledgeBases}
          mcpServers={mcpServers}
        />
      )}

      <CreatePersonaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePersona}
      />
    </div>
  );
};

export default ChatbotCustomization;
