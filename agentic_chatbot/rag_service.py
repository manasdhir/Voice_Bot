from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from config import EMBEDDING_MODEL_NAME, CHROMA_DIR

# Setup embedding and vector store
embedding_model = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_NAME
)

vectorstore = Chroma(
    collection_name="documents",
    embedding_function=embedding_model,
    persist_directory=CHROMA_DIR
)

@tool
def search_docs(query: str) -> str:
    """Search the uploaded documents (RAG) for relevant context."""
    docs = vectorstore.similarity_search(query, k=4)
    if not docs:
        return "No relevant information found in uploaded documents."
    
    return "\n\n".join(
        f"[{doc.metadata.get('source', 'Unknown')}]\n{doc.page_content.strip()}"
        for doc in docs
    )

# ---------------------- Test Code ----------------------
if __name__ == "__main__":
    print("🔍 Testing search_docs RAG tool...\n")
    while True:
        user_input = input("Enter a query (or 'exit'): ").strip()
        if user_input.lower() == "exit":
            break
        try:
            result = search_docs.invoke({"query": user_input})
            print("\n📄 Results:\n")
            print(result)
        except Exception as e:
            print(f"❌ Error: {e}")
