import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/authContext";

const fileTypeIcon = (type) => {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("doc")) return "📝";
  if (type.includes("image")) return "🖼️";
  if (type.includes("text")) return "📃";
  if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
  return "📁";
};

const SignInPrompt = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center justify-center text-neutral-700 dark:text-white p-8">
      <div className="flex flex-col items-center gap-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-neutral-200 dark:border-white/20 max-w-md text-center">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-orange-400">Knowledge Base</h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          You need to sign in to access the Knowledge Base. Create knowledge
          bases, upload documents, and organize your information.
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Please go to the Profile section to sign in or create an account.
        </p>
        <div className="flex items-center gap-2 text-orange-400 text-sm">
          <span>📚</span>
          <span>Personal knowledge management</span>
        </div>
      </div>
    </div>
  );
};

const CreateKnowledgeBaseModal = ({ isOpen, onClose, onCreate }) => {
  const { session } = useAuth();
  const token = session?.access_token;

  const [form, setForm] = useState({ name: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      // TODO: Replace with actual API call to create knowledge base
      // For now, just create locally until the create API is available
      onCreate({
        id: Date.now().toString(),
        name: form.name,
        description: form.description,
        docCount: 0,
        created: new Date().toISOString().split("T")[0],
        articles: [],
      });

      setForm({ name: "", description: "" });
      onClose();
    } catch (error) {
      console.error("Error creating knowledge base:", error);
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
          Create Knowledge Base
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
              placeholder="Enter knowledge base name"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              placeholder="Enter description (optional)"
              rows={3}
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
              {isCreating ? "Creating..." : "Create"}
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

const KnowledgeBaseList = ({
  knowledgeBases,
  onSelect,
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
          Loading knowledge bases...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl text-red-500 mb-2">
          Error Loading Knowledge Bases
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
            Your Knowledge Bases
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm mt-1">
            Create and manage your knowledge collections
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
        {knowledgeBases.map((kb) => (
          <div
            key={kb.id}
            onClick={() => onSelect(kb)}
            className="bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-white/20 cursor-pointer hover:shadow-xl hover:border-orange-400 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">📚</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {kb.created}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2 group-hover:text-orange-400 transition-colors">
              {kb.name}
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">
              {kb.description || "No description"}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>📄</span>
                <span>{kb.docCount} documents</span>
              </div>
              <div className="text-orange-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Enter →
              </div>
            </div>
          </div>
        ))}

        {knowledgeBases.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
              No Knowledge Bases
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Create your first knowledge base to get started
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              Create Knowledge Base
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const KnowledgeBaseDetail = ({ knowledgeBase, onBack, onUpdateKB }) => {
  const { session } = useAuth();
  const token = session?.access_token;

  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState(knowledgeBase.articles || []);
  const [form, setForm] = useState({ title: "", summary: "" });
  const [mode, setMode] = useState("upload");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const inputRef = useRef();

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
  );

  // Updated uploadFileToServer function with proper API integration
  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log(
        `📤 Uploading file: ${file.name} to knowledge base: ${knowledgeBase.name}`
      );

      // Use the knowledge base name as kg_name parameter
      const endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/upload_doc?kg_name=${encodeURIComponent(knowledgeBase.name)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Upload successful:", result);

      return {
        success: true,
        data: result,
        message: result.message || "File uploaded successfully",
      };
    } catch (error) {
      console.error("❌ Upload error:", error);
      return {
        success: false,
        error: error.message,
        message: `Upload failed: ${error.message}`,
      };
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;

    const newArticle = {
      id: Date.now(),
      title: form.title,
      summary: form.summary,
      type: "manual",
    };

    setArticles([...articles, newArticle]);

    // Update the knowledge base
    onUpdateKB({
      ...knowledgeBase,
      articles: [...articles, newArticle],
      docCount: articles.length + 1,
    });

    setForm({ title: "", summary: "" });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(`Uploading ${files.length} file(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        console.log(`🔄 Processing file: ${file.name} (${file.size} bytes)`);
        const result = await uploadFileToServer(file);

        const newArticle = {
          id: Date.now() + Math.random(),
          title: file.name,
          summary: result.success
            ? `${(file.size / 1024).toFixed(1)} KB - ${result.message}`
            : `${(file.size / 1024).toFixed(1)} KB - ${result.message}`,
          type: file.type || "file",
          uploaded: result.success,
          uploadData: result.data || null,
        };

        setArticles((prev) => [...prev, newArticle]);

        if (result.success) {
          successCount++;
          console.log(`✅ ${file.name} uploaded successfully`);
        } else {
          failCount++;
          console.error(`❌ ${file.name} upload failed:`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error processing ${file.name}:`, error);

        const errorArticle = {
          id: Date.now() + Math.random(),
          title: file.name,
          summary: `${(file.size / 1024).toFixed(1)} KB - Error: ${
            error.message
          }`,
          type: file.type || "file",
          uploaded: false,
        };

        setArticles((prev) => [...prev, errorArticle]);
      }
    }

    // Update knowledge base doc count
    onUpdateKB({
      ...knowledgeBase,
      articles: articles,
      docCount: knowledgeBase.docCount + successCount,
    });

    // Set final status
    if (successCount > 0 && failCount === 0) {
      setUploadStatus(`✅ All ${successCount} file(s) uploaded successfully!`);
    } else if (successCount > 0 && failCount > 0) {
      setUploadStatus(
        `⚠️ ${successCount} file(s) uploaded, ${failCount} failed`
      );
    } else {
      setUploadStatus(`❌ All ${failCount} file(s) failed to upload`);
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(""), 5000);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(`Uploading ${files.length} file(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        console.log(`🔄 Processing file: ${file.name} (${file.size} bytes)`);
        const result = await uploadFileToServer(file);

        const newArticle = {
          id: Date.now() + Math.random(),
          title: file.name,
          summary: result.success
            ? `${(file.size / 1024).toFixed(1)} KB - ${result.message}`
            : `${(file.size / 1024).toFixed(1)} KB - ${result.message}`,
          type: file.type || "file",
          uploaded: result.success,
          uploadData: result.data || null,
        };

        setArticles((prev) => [...prev, newArticle]);

        if (result.success) {
          successCount++;
          console.log(`✅ ${file.name} uploaded successfully`);
        } else {
          failCount++;
          console.error(`❌ ${file.name} upload failed:`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error processing ${file.name}:`, error);

        const errorArticle = {
          id: Date.now() + Math.random(),
          title: file.name,
          summary: `${(file.size / 1024).toFixed(1)} KB - Error: ${
            error.message
          }`,
          type: file.type || "file",
          uploaded: false,
        };

        setArticles((prev) => [...prev, errorArticle]);
      }
    }

    // Update knowledge base doc count
    onUpdateKB({
      ...knowledgeBase,
      articles: articles,
      docCount: knowledgeBase.docCount + successCount,
    });

    // Set final status
    if (successCount > 0 && failCount === 0) {
      setUploadStatus(`✅ All ${successCount} file(s) uploaded successfully!`);
    } else if (successCount > 0 && failCount > 0) {
      setUploadStatus(
        `⚠️ ${successCount} file(s) uploaded, ${failCount} failed`
      );
    } else {
      setUploadStatus(`❌ All ${failCount} file(s) failed to upload`);
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(""), 5000);

    // Reset the input
    e.target.value = "";
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
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            {knowledgeBase.name}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm">
            {knowledgeBase.description || "No description"}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 mb-6 w-full">
        <button
          onClick={() => setMode("upload")}
          className={`px-6 py-2 rounded-xl font-semibold backdrop-blur-md bg-white/10 dark:bg-white/10 border border-neutral-200 dark:border-white/20 transition-all duration-150 ${
            mode === "upload"
              ? "bg-white/30 dark:bg-white/30 text-orange-500 border-orange-400 shadow-lg"
              : "hover:bg-white/20 dark:hover:bg-white/20 text-neutral-600 dark:text-neutral-200"
          }`}
        >
          Upload
        </button>
        <button
          onClick={() => setMode("type")}
          className={`px-6 py-2 rounded-xl font-semibold backdrop-blur-md bg-white/10 dark:bg-white/10 border border-neutral-200 dark:border-white/20 transition-all duration-150 ${
            mode === "type"
              ? "bg-white/30 dark:bg-white/30 text-orange-500 border-orange-400 shadow-lg"
              : "hover:bg-white/20 dark:hover:bg-white/20 text-neutral-600 dark:text-neutral-200"
          }`}
        >
          Type
        </button>
      </div>

      {/* Upload/Type Interface */}
      <div className="mb-8">
        {mode === "upload" ? (
          <div className="w-full">
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-lg bg-white/10 dark:bg-white/10 border-neutral-200 dark:border-white/20 w-full ${
                dragActive
                  ? "border-orange-500 bg-orange-100/30 dark:bg-orange-900/30"
                  : ""
              } ${uploading ? "pointer-events-none opacity-50" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              onClick={() => !uploading && inputRef.current.click()}
            >
              <input
                type="file"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.png,.jpg,.jpeg,.gif,.bmp,.svg,.webp,.xls,.xlsx,.csv,.ppt,.pptx"
              />
              <span className="text-5xl mb-2">{uploading ? "⏳" : "⬆️"}</span>
              <span className="font-semibold text-lg text-neutral-700 dark:text-neutral-200">
                {uploading
                  ? "Uploading files..."
                  : "Drag & Drop files here or click to upload"}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">
                Supported: PDF, DOCX, Images, Text, Spreadsheets, etc.
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Knowledge Base: {knowledgeBase.name}
              </span>
            </div>
            {uploadStatus && (
              <div
                className={`mt-4 p-3 rounded-lg text-center text-sm ${
                  uploadStatus.includes("✅") ||
                  uploadStatus.includes("successfully")
                    ? "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30"
                    : uploadStatus.includes("❌") ||
                      uploadStatus.includes("failed")
                    ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30"
                    : uploadStatus.includes("⚠️")
                    ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                }`}
              >
                {uploadStatus}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 bg-white/10 dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-neutral-200 dark:border-white/20 shadow-xl w-full"
          >
            <input
              type="text"
              placeholder="Document Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              required
            />
            <textarea
              placeholder="Summary / Description"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/20 dark:bg-white/20 text-black dark:text-white border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
              rows={3}
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-semibold bg-orange-500/80 hover:bg-orange-600/80 text-white shadow-md backdrop-blur-md transition-all"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 px-4 py-2 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-md text-black dark:text-white w-full border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
      />

      {/* Documents Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="text-neutral-500 dark:text-neutral-400 text-center col-span-full">
            No documents found.
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-4 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow hover:shadow-xl transition border border-neutral-200 dark:border-white/20 min-h-[70px] w-full"
            >
              <div className="text-3xl">
                {article.type === "manual" ? "📝" : fileTypeIcon(article.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-base flex items-center gap-2 text-black dark:text-white">
                  {article.title}
                  {article.uploaded === true && (
                    <span className="text-green-400 text-xs">✓</span>
                  )}
                  {article.uploaded === false && (
                    <span className="text-red-400 text-xs">✗</span>
                  )}
                </div>
                <div className="truncate text-neutral-600 dark:text-neutral-300 text-xs">
                  {article.summary}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const KnowledgeBase = () => {
  const { user, isSignedIn, loading, session } = useAuth();
  const token = session?.access_token;

  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKB, setSelectedKB] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingKBs, setLoadingKBs] = useState(true);
  const [error, setError] = useState(null);

  // Fetch knowledge bases from API
  const fetchKnowledgeBases = async () => {
    if (!isSignedIn || !token) return;

    try {
      setLoadingKBs(true);
      setError(null);

      console.log("🔍 Fetching knowledge bases...");

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
        console.error("❌ API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Knowledge bases response:", data);

      // Transform API response to match UI expectations
      const transformedKBs = data.knowledge_bases.map((name, index) => ({
        id: `kb_${index}_${Date.now()}`, // Generate unique ID
        name: name,
        description: "", // API doesn't provide description
        docCount: 0, // API doesn't provide doc count
        created: new Date().toISOString().split("T")[0], // Use current date
        articles: [], // Initialize empty articles array
      }));

      setKnowledgeBases(transformedKBs);
      console.log(
        `✅ Loaded ${data.total_count} knowledge bases for user ${data.user_id}`
      );
    } catch (error) {
      console.error("❌ Error fetching knowledge bases:", error);
      setError(error.message);
    } finally {
      setLoadingKBs(false);
    }
  };

  // Load knowledge bases on mount and when auth state changes
  useEffect(() => {
    if (isSignedIn && token) {
      fetchKnowledgeBases();
    } else {
      setKnowledgeBases([]);
      setLoadingKBs(false);
    }
  }, [isSignedIn, token]);

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

  const handleCreateKB = (newKB) => {
    setKnowledgeBases([...knowledgeBases, newKB]);
  };

  const handleUpdateKB = (updatedKB) => {
    setKnowledgeBases((prev) =>
      prev.map((kb) => (kb.id === updatedKB.id ? updatedKB : kb))
    );
  };

  const handleRetry = () => {
    fetchKnowledgeBases();
  };

  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl flex flex-col items-center text-neutral-700 dark:text-white p-8 overflow-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Knowledge Base
        </h1>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span>👋</span>
          <span>Welcome, {user.name}!</span>
        </div>
      </div>

      {selectedKB ? (
        <KnowledgeBaseDetail
          knowledgeBase={selectedKB}
          onBack={() => setSelectedKB(null)}
          onUpdateKB={handleUpdateKB}
        />
      ) : (
        <KnowledgeBaseList
          knowledgeBases={knowledgeBases}
          onSelect={setSelectedKB}
          onCreateNew={() => setShowCreateModal(true)}
          loading={loadingKBs}
          error={error}
          onRetry={handleRetry}
        />
      )}

      <CreateKnowledgeBaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateKB}
      />
    </div>
  );
};

export default KnowledgeBase;
