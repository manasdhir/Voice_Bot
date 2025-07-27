from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.tools import tool
from config import EMBEDDING_MODEL_NAME, EMBEDDING_SIZE
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from qdrant_client.http.exceptions import UnexpectedResponse
from typing_extensions import Annotated
from langchain_core.runnables import RunnableConfig
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Setup embedding and vector store
embedding_model = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_NAME,
    model_kwargs={
        "device": "cpu",
        "trust_remote_code": True
    },
    encode_kwargs={
        "normalize_embeddings": True
    }
)
qdrant_client = QdrantClient(
    host="localhost",  # or Qdrant Cloud URL
    port=6333,
)
collection_name = "documents"
try:
    qdrant_client.get_collection(collection_name=collection_name)
except UnexpectedResponse:
    qdrant_client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE),
    )

vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=collection_name,
    embedding=embedding_model,
)

@tool
def search_docs(query: str,config: RunnableConfig) -> str:
    """Search the uploaded documents (RAG) for relevant context."""
    userid=config["configurable"].get("thread_id")
    print(userid)
    metadata_filter = Filter(
        should=[
            FieldCondition(
                key="metadata.userid",
                match=MatchValue(value=userid)
            )
        ]
    )
    docs = vectorstore.similarity_search(query, k=4, filter=metadata_filter)
    for doc in docs:
        print(doc.metadata)
    if not docs:
        return "No relevant information found in uploaded documents."
    
    return "\n\n".join(
        f"[{doc.metadata.get('source', 'Unknown')}]\n{doc.page_content.strip()}"
        for doc in docs 
    )

# ---------------------- Test Code ----------------------
if __name__ == "__main__":
    print("🔍 Testing search_docs RAG tool...\n")

    # Example test user ID (thread_id)
    test_user_id = "e6184db0-6c6f-4e0e-961a-5e55a6c5b3c7"

    while True:
        user_input = input("Enter a query (or 'exit'): ").strip()
        if user_input.lower() == "exit":
            break
        try:
            # ⬇️ Include the configurable thread_id (user_id)
            result = search_docs.invoke(
                {"query": user_input},
                config=RunnableConfig(configurable={"thread_id": test_user_id})
            )
            #print("\n📄 Results:\n")
            #print(result)
        except Exception as e:
            print(f"❌ Error: {e}")
