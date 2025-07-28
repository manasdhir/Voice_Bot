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
from typing import List, Set

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

async def get_user_knowledge_bases(userid: str) -> List[str]:
    try:
        # Create filter to get all documents for this user
        metadata_filter = Filter(
            must=[
                FieldCondition(
                    key="metadata.userid",
                    match=MatchValue(value=userid)
                )
            ]
        )
        
        # Use Qdrant client directly for better performance
        scroll_result = qdrant_client.scroll(
            collection_name=collection_name,
            scroll_filter=metadata_filter,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        
        # Extract unique knowledge base names from kb_identifier
        knowledge_bases: Set[str] = set()
        userid_prefix = f"{userid}_"
        
        for point in scroll_result[0]:
            payload = point.payload
            if payload and 'metadata' in payload:
                kb_identifier = payload['metadata'].get('kb_identifier')
                if kb_identifier and kb_identifier.startswith(userid_prefix):
                    # Extract KB name by removing the userid_ prefix
                    kb_name = kb_identifier[len(userid_prefix):]
                    if kb_name:  # Make sure it's not empty
                        knowledge_bases.add(kb_name)
        
        return sorted(list(knowledge_bases))
        
    except Exception as e:
        print(f"❌ Error fetching knowledge bases for user {userid}: {str(e)}")
        return []

@tool
def search_docs(query: str, knowledge_base: str, config: RunnableConfig) -> str:
    """Search the knowledge base for relevant context within a specific knowledge base."""
    userid = config["configurable"].get("thread_id")
    print(f"Searching for user: {userid}, knowledge_base: {knowledge_base}")
    
    # Create knowledge base identifier by concatenating userid and knowledge_base
    kb_identifier = f"{userid}_{knowledge_base}"
    
    # Filter by both userid and knowledge_base using the combined identifier
    metadata_filter = Filter(
        must=[  # Changed from 'should' to 'must' to require both conditions
            FieldCondition(
                key="metadata.userid",
                match=MatchValue(value=userid)
            ),
            FieldCondition(
                key="metadata.kb_identifier", 
                match=MatchValue(value=kb_identifier)
            )
        ]
    )
    
    docs = vectorstore.similarity_search(query, k=4, filter=metadata_filter)
    
    for doc in docs:
        print(f"Found doc from KB: {doc.metadata.get('knowledge_base')}, Source: {doc.metadata.get('source')}")
    
    if not docs:
        return f"No relevant information found in knowledge base '{knowledge_base}' for this user."
    
    return "\n\n".join(
        f"[{doc.metadata.get('source', 'Unknown')} - KB: {doc.metadata.get('knowledge_base', 'Unknown')}]\n{doc.page_content.strip()}"
        for doc in docs 
    )

# ---------------------- Test Code ----------------------
if __name__ == "__main__":
    print("🔍 Testing search_docs RAG tool with knowledge base filtering...\n")

    # Example test user ID and knowledge base
    test_user_id = "e6184db0-6c6f-4e0e-961a-5e55a6c5b3c7"
    test_knowledge_base = "technical"  # Example knowledge base name

    while True:
        user_input = input("Enter a query (or 'exit'): ").strip()
        if user_input.lower() == "exit":
            break
        
        # Optional: Allow changing knowledge base during testing
        kb_input = input(f"Knowledge base (current: {test_knowledge_base}, press Enter to keep): ").strip()
        if kb_input:
            test_knowledge_base = kb_input
            
        try:
            # Include both query and knowledge_base parameters
            result = search_docs.invoke(
                {
                    "query": user_input,
                    "knowledge_base": test_knowledge_base
                },
                config=RunnableConfig(configurable={"thread_id": test_user_id})
            )
            print(f"\n📄 Results from '{test_knowledge_base}' knowledge base:\n")
            print(result)
            print("\n" + "="*50 + "\n")
        except Exception as e:
            print(f"❌ Error: {e}")
