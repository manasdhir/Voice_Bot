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
    accents: [
      { code: "fr-FR", name: "France" },
      { code: "fr-CA", name: "Canada" },
    ],
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
    accents: [
      { code: "pt-BR", name: "Brazil" },
      { code: "pt-PT", name: "Portugal" },
    ],
  },
  {
    code: "ru",
    name: "Russian",
    accents: [{ code: "ru-RU", name: "Standard" }],
  },
  {
    code: "ar",
    name: "Arabic",
    accents: [{ code: "ar-SA", name: "Standard" }],
  },
  {
    code: "hi",
    name: "Hindi",
    accents: [{ code: "hi-IN", name: "Standard" }],
  },
  {
    code: "zh",
    name: "Chinese",
    accents: [
      { code: "zh-CN", name: "Mandarin" },
      { code: "zh-HK", name: "Cantonese" },
    ],
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
    code: "da",
    name: "Danish",
    accents: [{ code: "da-DK", name: "Standard" }],
  },
  {
    code: "fi",
    name: "Finnish",
    accents: [{ code: "fi-FI", name: "Standard" }],
  },
  {
    code: "no",
    name: "Norwegian",
    accents: [{ code: "no-NO", name: "Standard" }],
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

const dummyKnowledgeBases = [
  { id: "general", name: "General Knowledge", docCount: 15 },
  { id: "technical", name: "Technical Documentation", docCount: 8 },
  { id: "personal", name: "Personal Notes", docCount: 23 },
  { id: "business", name: "Business Resources", docCount: 12 },
];

const SignInPrompt = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
      <div className="flex flex-col items-center gap-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md text-center">
        <div className="text-6xl">🤖</div>
        <h2 className="text-2xl font-bold text-orange-400">Persona Customization</h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          You need to sign in to customize your chatbot personas and voice settings.
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
    customPrompt: "" 
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.customPrompt.trim()) return;
    
    setIsCreating(true);
    setError("");
    
    try {
      const response = await fetch('http://127.0.0.1:8000/personas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          icon: form.icon,
          custom_prompt: form.customPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create persona');
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
      console.error('Error creating persona:', error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-white/20 max-w-lg w-full">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Create New Persona</h3>
        
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              onChange={(e) => setForm({ ...form, customPrompt: e.target.value })}
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

const PersonaList = ({ personas, onSelect, onCreateNew, onToggleActive }) => {
  const activePersona = personas.find(p => p.isActive);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">Your Personas</h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm mt-1">
            Choose from default personas or create your own custom AI assistant personalities
          </p>
          {activePersona && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-orange-400">Currently Active:</span>
              <span className="text-black dark:text-white font-medium">{activePersona.name}</span>
              <span>{activePersona.icon}</span>
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
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    persona.isActive
                      ? "bg-orange-500"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      persona.isActive ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {persona.created_at?.split('T')[0]}
                </div>
              </div>
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 transition-colors ${
              persona.isActive 
                ? "text-orange-400" 
                : "text-black dark:text-white group-hover:text-orange-400"
            }`}>
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
                    : dummyKnowledgeBases.find(kb => kb.id === persona.knowledge_base)?.name || "General"
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🌍</span>
                <span>{languageOptions.find(l => l.code === persona.language)?.name || "English"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🗣️</span>
                <span>{languageOptions.find(l => l.code === persona.language)?.accents.find(a => a.code === persona.accent)?.name || "Indian"}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  persona.isActive 
                    ? "bg-orange-500/20 text-orange-600 dark:text-orange-300 font-medium"
                    : "bg-neutral-500/20 text-neutral-600 dark:text-neutral-300"
                }`}>
                  {persona.isActive ? "● Active" : "○ Inactive"}
                </div>
                {persona.is_default && (
                  <div className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                    Default
                  </div>
                )}
              </div>
              <button
                onClick={() => onSelect(persona)}
                className={`text-sm transition-all hover:scale-105 ${
                  persona.isActive
                    ? "text-orange-400 hover:text-orange-300"
                    : "text-orange-400 opacity-0 group-hover:opacity-100 hover:text-orange-300"
                }`}
              >
                Configure →
              </button>
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

const PersonaDetail = ({ persona, onBack, onUpdatePersona }) => {
  const { session } = useAuth();
  const token = session?.access_token;
  
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(persona.knowledge_base || persona.knowledgeBase);
  const [selectedLanguage, setSelectedLanguage] = useState(persona.language);
  const [selectedAccent, setSelectedAccent] = useState(persona.accent);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testText, setTestText] = useState("Hello! This is a voice test. How do you like my voice?");
  const [voiceTestStatus, setVoiceTestStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef();

  const currentLanguage = languageOptions.find(lang => lang.code === selectedLanguage);
  const availableAccents = currentLanguage ? currentLanguage.accents : [];

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    const lang = languageOptions.find(l => l.code === langCode);
    if (lang && lang.accents.length > 0) {
      setSelectedAccent(lang.accents[0].code);
    }
  };

  const testVoice = async () => {
    if (!testText.trim()) {
      setVoiceTestStatus("Please enter some text to test");
      return;
    }

    setIsTestingVoice(true);
    setVoiceTestStatus("Generating voice sample...");

    try {
      const response = await fetch("http://127.0.0.1:8000/voice_test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: testText,
          language: selectedAccent,
          voice_settings: {
            speed: 1.0,
            pitch: 1.0,
          },
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setVoiceTestStatus("Playing voice sample...");
        }
      } else {
        throw new Error(`Voice test failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Voice test error:", error);
      setVoiceTestStatus(`Error: ${error.message}`);
    } finally {
      setIsTestingVoice(false);
      setTimeout(() => setVoiceTestStatus(""), 3000);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setVoiceTestStatus("Saving settings...");

    try {
      let endpoint;
      if (persona.is_default) {
        // For default personas, use the update endpoint (to be implemented later)
        endpoint = `http://127.0.0.1:8000/personas/default/${persona.id}/update`;
      } else {
        // For user personas, use the existing update endpoint
        endpoint = `http://127.0.0.1:8000/personas/${persona.id}`;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          knowledge_base: selectedKnowledgeBase,
          language: selectedLanguage,
          accent: selectedAccent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save settings');
      }

      if (persona.is_default) {
        // For default personas, just update locally since backend implementation is pending
        const updatedPersona = {
          ...persona,
          knowledge_base: selectedKnowledgeBase,
          language: selectedLanguage,
          accent: selectedAccent,
        };
        onUpdatePersona(updatedPersona);
      } else {
        // For user personas, use the API response
        const updatedPersona = await response.json();
        const frontendPersona = {
          ...persona,
          knowledge_base: updatedPersona.knowledge_base,
          language: updatedPersona.language,
          accent: updatedPersona.accent,
        };
        onUpdatePersona(frontendPersona);
      }
      
      setVoiceTestStatus("Settings saved successfully!");
    } catch (error) {
      console.error('Error saving settings:', error);
      setVoiceTestStatus(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setVoiceTestStatus(""), 3000);
    }
  };

  const resetSettings = () => {
    setSelectedKnowledgeBase(persona.knowledge_base || persona.knowledgeBase);
    setSelectedLanguage(persona.language);
    setSelectedAccent(persona.accent);
    setTestText("Hello! This is a voice test. How do you like my voice?");
    setVoiceTestStatus("Settings reset to original values");
    setTimeout(() => setVoiceTestStatus(""), 3000);
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
            <h2 className="text-2xl font-semibold text-black dark:text-white">{persona.name}</h2>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm">
              {persona.description}
            </p>
            {persona.isActive && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="inline-block w-2 h-2 bg-orange-400 rounded-full"></span>
                <span className="text-orange-400 font-medium">Currently Active</span>
              </div>
            )}
            {persona.is_default && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-blue-400 text-xs">Default Persona</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Persona Prompt (Read-only) */}
        <div className="lg:col-span-2 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20">
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
          
          <div className="space-y-3">
            {dummyKnowledgeBases.map((kb) => (
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
                  <div className="font-medium text-black dark:text-white">{kb.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {kb.docCount} documents
                  </div>
                </div>
                {selectedKnowledgeBase === kb.id && (
                  <span className="text-orange-400">✓</span>
                )}
              </button>
            ))}
          </div>
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
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
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
                onChange={(e) => setSelectedAccent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {availableAccents.map((accent) => (
                  <option key={accent.code} value={accent.code} className="bg-white dark:bg-gray-800">
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
                rows={2}
                placeholder="Enter text to test the voice..."
              />
              
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
                    voiceTestStatus.includes("successfully") || voiceTestStatus.includes("Playing")
                      ? "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30"
                      : voiceTestStatus.includes("Error") || voiceTestStatus.includes("failed")
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
          disabled={isSaving}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isSaving
              ? "bg-neutral-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {isSaving ? "Saving..." : "💾 Save Settings"}
        </button>
        <button
          onClick={resetSettings}
          className="px-6 py-2 rounded-lg bg-neutral-500 text-white hover:bg-neutral-600 transition-colors font-medium"
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

  // Load all personas on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isSignedIn || !token) return;
      
      try {
        // Fetch all personas (default + custom) from the single endpoint
        const response = await fetch('http://127.0.0.1:8000/personas/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Use the is_active flag directly from the backend
          const transformedPersonas = data.personas.map(persona => ({
            ...persona,
            isActive: persona.is_active, // Use the backend flag directly
          }));
          
          setPersonas(transformedPersonas);
          console.log(`✅ Loaded ${data.total} personas (${data.default_count} default, ${data.user_count} custom)`);
        }
      } catch (error) {
        console.error('Error fetching personas:', error);
      } finally {
        setLoadingPersonas(false);
      }
    };

    if (isSignedIn) {
      fetchData();
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
    setPersonas(prev => 
      prev.map(persona => persona.id === updatedPersona.id ? updatedPersona : persona)
    );
    setSelectedPersona(updatedPersona);
  };

  const handleToggleActive = async (personaId, isDefault = false) => {
    try {
      let endpoint;
      if (isDefault) {
        // For default personas, use the activate default endpoint
        endpoint = `http://127.0.0.1:8000/personas/default/${personaId}/activate`;
      } else {
        // For user personas, use the user persona activate endpoint
        endpoint = `http://127.0.0.1:8000/personas/${personaId}/activate`;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update the local state to reflect the new active persona
        setPersonas(prev => 
          prev.map(persona => ({
            ...persona,
            isActive: persona.id === personaId // Only the selected persona is active
          }))
        );
      }
    } catch (error) {
      console.error('Error activating persona:', error);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col text-neutral-700 dark:text-white p-8 overflow-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Persona Customization</h1>
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
        />
      ) : (
        <PersonaList
          personas={personas}
          onSelect={setSelectedPersona}
          onCreateNew={() => setShowCreateModal(true)}
          onToggleActive={handleToggleActive}
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
