import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/authContext";

const SignInPrompt = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
      <div className="flex flex-col items-center gap-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md text-center">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-orange-400">MCP Servers</h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          You need to sign in to access MCP Servers. Create and manage your
          Model Context Protocol server connections.
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Please go to the Profile section to sign in or create an account.
        </p>
        <div className="flex items-center gap-2 text-orange-400 text-sm">
          <span>🌐</span>
          <span>External API integrations</span>
        </div>
      </div>
    </div>
  );
};

const CreateMCPServerModal = ({ isOpen, onClose, onCreate }) => {
  const { session } = useAuth();

  const [form, setForm] = useState({ 
    name: "", 
    url: "", 
    bearerToken: "" 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      // Create new MCP server using API
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/mcps/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            name: form.name,
            url: form.url,
            bearer_token: form.bearerToken || null,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ MCP server created successfully:", result);

      // Transform API response to match UI expectations
      const serverData = {
        id: result.id || Date.now().toString(),
        name: form.name,
        url: form.url,
        bearerToken: form.bearerToken,
        created: new Date().toISOString().split("T")[0],
        status: "active",
      };

      onCreate(serverData);
      setForm({ name: "", url: "", bearerToken: "" });
      onClose();
    } catch (error) {
      console.error("Error creating MCP server:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md w-full">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-6">
          Create MCP Server
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
              placeholder="Enter MCP server name"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              URL *
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="https://api.example.com/mcp"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Bearer Token (Optional)
            </label>
            <input
              type="password"
              value={form.bearerToken}
              onChange={(e) => setForm({ ...form, bearerToken: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Bearer token for authentication"
              disabled={isCreating}
            />
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
              {isCreating ? "Saving..." : "Create"}
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

const MCPServerList = ({
  mcpServers,
  onDelete,
  onCreateNew,
  loading,
  error,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <div className="text-xl text-neutral-600 dark:text-neutral-300">
          Loading MCP servers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl text-red-500 mb-2">
          Error Loading MCP Servers
        </div>
        <div className="text-neutral-600 dark:text-neutral-300 text-center mb-4">
          {error}
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Your MCP Servers
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm mt-1">
            Manage your Model Context Protocol server connections
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
        >
          <span>➕</span>
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mcpServers.map((server) => (
          <div
            key={server.id}
            className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20 hover:shadow-xl hover:border-orange-400 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">🌐</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  server.status === "active" ? "bg-green-400" : "bg-red-400"
                }`}></div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {server.created}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2 group-hover:text-orange-400 transition-colors">
              {server.name}
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 truncate">
              {server.url}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>🔑</span>
                <span>{server.bearerToken ? "Authenticated" : "No auth"}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(server.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                  title="Delete server"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {mcpServers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
              No MCP Servers
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Create your first MCP server connection to get started
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              Create MCP Server
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MCPServers = () => {
  const { user, isSignedIn, loading, session } = useAuth();
  const token = session?.access_token;

  const [mcpServers, setMcpServers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingServers, setLoadingServers] = useState(true);
  const [error, setError] = useState(null);

  // Fetch MCP servers from API
  const fetchMcpServers = useCallback(async () => {
    if (!isSignedIn || !token) return;

    try {
      setLoadingServers(true);
      setError(null);

      console.log("🔍 Fetching MCP servers...");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/mcps`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ MCP servers response:", data);

      // Transform API response to match UI expectations
      setMcpServers(data.servers || []);
      console.log(
        `✅ Loaded ${data.servers?.length || 0} MCP servers for user ${data.user_id}`,
      );
    } catch (error) {
      console.error("❌ Error fetching MCP servers:", error);
      setError(error.message);
    } finally {
      setLoadingServers(false);
    }
  }, [isSignedIn, token]);

  // Load MCP servers on mount and when auth state changes
  useEffect(() => {
    if (isSignedIn && token) {
      fetchMcpServers();
    } else {
      setMcpServers([]);
      setLoadingServers(false);
    }
  }, [isSignedIn, token, fetchMcpServers]);

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

  const handleCreateServer = (serverData) => {
    // Create new server
    setMcpServers((prev) => [...prev, serverData]);
  };

  const handleDeleteServer = async (serverId) => {
    if (!confirm("Are you sure you want to delete this MCP server?")) return;

    try {
      console.log(`🗑️ Deleting MCP server: ${serverId}`);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/mcps/delete/${serverId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ MCP server deleted successfully:", result);

      // Remove server from local state
      setMcpServers((prev) => prev.filter((server) => server.id !== serverId));
      console.log(`✅ Deleted MCP server: ${serverId}`);
    } catch (error) {
      console.error("❌ Error deleting MCP server:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRetry = () => {
    fetchMcpServers();
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center text-neutral-700 dark:text-white p-8 overflow-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          MCP Servers
        </h1>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span>👋</span>
          <span>Welcome, {user.name}!</span>
        </div>
      </div>

      <MCPServerList
        mcpServers={mcpServers}
        onDelete={handleDeleteServer}
        onCreateNew={() => setShowCreateModal(true)}
        loading={loadingServers}
        error={error}
        onRetry={handleRetry}
      />

      <CreateMCPServerModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onCreate={handleCreateServer}
      />
    </div>
  );
};

export default MCPServers;
