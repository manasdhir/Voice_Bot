import React, { useState, useRef } from "react";
import { useAuth } from "../../context/authContext";

// ...existing code...
const dummyArticles = [
  {
    id: 1,
    title: "How to use the Voice Bot?",
    summary: "A quick start guide to using the Voice Bot for your daily tasks.",
  },
  {
    id: 2,
    title: "Troubleshooting common issues",
    summary: "Solutions to the most common problems users face.",
  },
  {
    id: 3,
    title: "Integrating with other tools",
    summary: "Learn how to connect the Voice Bot with your favorite apps.",
  },
  {
    id: 4,
    title: "Privacy and Security",
    summary: "Understand how your data is protected and managed.",
  },
];

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
          You need to sign in to access the Knowledge Base. Upload documents,
          create notes, and search through your knowledge collection.
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

const KnowledgeBase = () => {
  const { user, isSignedIn, loading, session } = useAuth();
  const token = session?.access_token;
  //console.log(session)
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState(
    dummyArticles.map((a) => ({ ...a, type: "manual" }))
  );
  const [form, setForm] = useState({ title: "", summary: "" });
  const [mode, setMode] = useState("upload"); // 'upload' or 'type'
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const inputRef = useRef();

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

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
  );

  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload_doc", {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;
    setArticles([
      ...articles,
      {
        id: Date.now(),
        title: form.title,
        summary: form.summary,
        type: "manual",
      },
    ]);
    setForm({ title: "", summary: "" });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);

    setUploading(true);
    setUploadStatus("Uploading files...");

    for (const file of files) {
      try {
        const result = await uploadFileToServer(file);

        if (result.success) {
          setArticles((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              title: file.name,
              summary: `${file.size} bytes - Uploaded successfully`,
              type: file.type || "file",
              uploaded: true,
            },
          ]);
          setUploadStatus(`${file.name} uploaded successfully!`);
        } else {
          setArticles((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              title: file.name,
              summary: `${file.size} bytes - Upload failed: ${result.error}`,
              type: file.type || "file",
              uploaded: false,
            },
          ]);
          setUploadStatus(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        setUploadStatus(`Error uploading ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(""), 3000);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    setUploading(true);
    setUploadStatus("Uploading files...");

    for (const file of files) {
      try {
        const result = await uploadFileToServer(file);

        if (result.success) {
          setArticles((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              title: file.name,
              summary: `${file.size} bytes - Uploaded successfully`,
              type: file.type || "file",
              uploaded: true,
            },
          ]);
          setUploadStatus(`${file.name} uploaded successfully!`);
        } else {
          setArticles((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              title: file.name,
              summary: `${file.size} bytes - Upload failed: ${result.error}`,
              type: file.type || "file",
              uploaded: false,
            },
          ]);
          setUploadStatus(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        setUploadStatus(`Error uploading ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    setTimeout(() => setUploadStatus(""), 3000);

    // Reset the input
    e.target.value = "";
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

      <div className="w-full flex flex-col gap-4 mb-8">
        <div className="flex justify-center gap-2 mb-4 w-full">
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
              />
              <span className="text-5xl mb-2">{uploading ? "⏳" : "⬆️"}</span>
              <span className="font-semibold text-lg text-neutral-700 dark:text-neutral-200">
                {uploading
                  ? "Uploading files..."
                  : "Drag & Drop files here or click to upload"}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">
                Supported: PDF, DOCX, Images, Text, etc.
              </span>
            </div>
            {uploadStatus && (
              <div
                className={`mt-4 p-3 rounded-lg text-center ${
                  uploadStatus.includes("successfully")
                    ? "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30"
                    : uploadStatus.includes("failed") ||
                      uploadStatus.includes("Error")
                    ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30"
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
      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 px-4 py-2 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-md text-black dark:text-white w-full border border-neutral-200 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-neutral-500 dark:placeholder:text-neutral-300"
      />
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

export default KnowledgeBase;
