import React, { useState } from "react";
import { useAuth } from "../../context/authContext";

const toolsData = [
  {
    id: "mcp",
    name: "Model Context Protocol",
    description: "Connect to external services and APIs via MCP",
    icon: "🔗",
    category: "Integration",
    enabled: false,
    config: {
      servers: [],
      timeout: 30000,
    },
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for real-time information",
    icon: "🔍",
    category: "Search",
    enabled: true,
    config: {
      provider: "google",
      safeSearch: true,
      maxResults: 5,
    },
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Execute code snippets in various languages",
    icon: "💻",
    category: "Development",
    enabled: false,
    config: {
      allowedLanguages: ["python", "javascript", "bash"],
      timeout: 10000,
    },
  },
  {
    id: "weather",
    name: "Weather Information",
    description: "Get current weather and forecasts",
    icon: "🌤️",
    category: "Information",
    enabled: true,
    config: {
      units: "metric",
      includeAlerts: true,
    },
  },
  {
    id: "calendar",
    name: "Calendar Integration",
    description: "Manage calendar events and schedules",
    icon: "📅",
    category: "Productivity",
    enabled: false,
    config: {
      defaultReminder: 15,
      timezone: "UTC",
    },
  },
  {
    id: "file_operations",
    name: "File Operations",
    description: "Read, write, and manage files",
    icon: "📁",
    category: "System",
    enabled: false,
    config: {
      allowedPaths: ["/tmp", "/home/user/documents"],
      maxFileSize: "10MB",
    },
  },
  {
    id: "translation",
    name: "Language Translation",
    description: "Translate text between languages",
    icon: "🌍",
    category: "Language",
    enabled: true,
    config: {
      provider: "google",
      autoDetect: true,
    },
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    icon: "🧮",
    category: "Utility",
    enabled: true,
    config: {
      precision: 10,
      scientificMode: true,
    },
  },
  {
    id: "task_management",
    name: "Task Management",
    description: "Create and manage tasks and reminders",
    icon: "✅",
    category: "Productivity",
    enabled: false,
    config: {
      defaultPriority: "medium",
      autoComplete: false,
    },
  },
  {
    id: "email",
    name: "Email Integration",
    description: "Send and manage emails",
    icon: "📧",
    category: "Communication",
    enabled: false,
    config: {
      smtpServer: "",
      port: 587,
      encryption: "TLS",
    },
  },
  {
    id: "url_shortener",
    name: "URL Shortener",
    description: "Create short links for long URLs",
    icon: "🔗",
    category: "Utility",
    enabled: true,
    config: {
      provider: "tinyurl",
      customDomain: false,
    },
  },
  {
    id: "system_info",
    name: "System Information",
    description: "Get system stats and information",
    icon: "💾",
    category: "System",
    enabled: true,
    config: {
      includeProcesses: false,
      includeNetwork: true,
    },
  },
];

const categories = [
  "All",
  "Integration",
  "Search",
  "Development",
  "Information",
  "Productivity",
  "System",
  "Language",
  "Utility",
  "Communication",
];

const SignInPrompt = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
      <div className="flex flex-col items-center gap-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md text-center">
        <div className="text-6xl">🛠️</div>
        <h2 className="text-2xl font-bold text-orange-400">Tools</h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          You need to sign in to access and configure voice bot tools. Enable
          integrations, search capabilities, and more.
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Please go to the Profile section to sign in or create an account.
        </p>
        <div className="flex items-center gap-2 text-orange-400 text-sm">
          <span>⚡</span>
          <span>Powerful voice bot capabilities</span>
        </div>
      </div>
    </div>
  );
};

const Tools = () => {
  const { user, isSignedIn, loading } = useAuth();
  const [tools, setTools] = useState(toolsData);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Show loading state
  if (loading) {
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

  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleTool = (toolId) => {
    setTools((prev) =>
      prev.map((tool) =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };

  const enabledCount = tools.filter((tool) => tool.enabled).length;

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col text-neutral-700 dark:text-white p-8 overflow-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Tools</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            <span className="font-semibold text-orange-400">
              {enabledCount}
            </span>{" "}
            of {tools.length} enabled
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <span>👋</span>
            <span>Welcome, {user.name}!</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-md text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
        />
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white/10 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/20 dark:hover:bg-white/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className={`bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border transition-all duration-200 hover:shadow-xl ${
              tool.enabled
                ? "border-orange-400 bg-orange-50/10 dark:bg-orange-900/10"
                : "border-neutral-200 dark:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{tool.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    {tool.name}
                  </h3>
                  <span className="text-xs text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                    {tool.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleTool(tool.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tool.enabled
                    ? "bg-orange-500"
                    : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tool.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
              {tool.description}
            </p>

            {tool.enabled && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/20">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Active</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
            No tools found
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setTools((prev) => prev.map((tool) => ({ ...tool, enabled: true })))
          }
          className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
        >
          Enable All
        </button>
        <button
          onClick={() =>
            setTools((prev) =>
              prev.map((tool) => ({ ...tool, enabled: false }))
            )
          }
          className="px-4 py-2 rounded-lg bg-neutral-500 text-white hover:bg-neutral-600 transition-colors font-medium"
        >
          Disable All
        </button>
        <button
          onClick={() => {
            const essentialTools = [
              "web_search",
              "weather",
              "translation",
              "calculator",
              "system_info",
            ];
            setTools((prev) =>
              prev.map((tool) => ({
                ...tool,
                enabled: essentialTools.includes(tool.id),
              }))
            );
          }}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
        >
          Enable Essentials
        </button>
      </div>
    </div>
  );
};

export default Tools;
