from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.tools import tool
from config import EMBEDDING_MODEL_NAME
from langchain_core.runnables import RunnableConfig
from qdrant_client.models import Filter, FieldCondition, MatchValue
from typing import List, Set
from custom_supabase import get_supabase
import logging
logger = logging.getLogger("voicebot")
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

class SupabaseVectorStore:
    def __init__(self):
        self.embedding_model = embedding_model

    async def add_documents(self, docs):
        """Add documents to Supabase vector store"""
        try:
            supabase = await get_supabase()

            documents_to_insert = []
            for doc in docs:
                embedding = self.embedding_model.embed_query(doc.page_content)

                documents_to_insert.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "embedding": embedding
                })

            # Batch insert for better performance
            await supabase.table("document_vectors").insert(documents_to_insert).execute()
            logger.info(f"✅ Added {len(docs)} documents to Supabase vector store")

        except Exception as e:
            logger.error(f"❌ Error adding documents to vector store: {e}")
            raise e

    async def similarity_search(self, query: str, k: int = 4, filter_conditions: dict = None):
        """Search for similar documents with optional filtering"""
        try:
            supabase = await get_supabase()

            query_embedding = self.embedding_model.embed_query(query)

            rpc_params = {
                'query_embedding': query_embedding,
                'match_count': k
            }

            # Simplified - only check for kb_identifier
            if filter_conditions and 'kb_identifier' in filter_conditions:
                rpc_params['filter_kb_identifier'] = filter_conditions['kb_identifier']

            response = await supabase.rpc('similarity_search_with_filters', rpc_params).execute()

            docs = []
            for row in response.data:
                docs.append(type('Document', (), {
                    'page_content': row['content'],
                    'metadata': row['metadata']
                })())

            return docs

        except Exception as e:
            logger.error(f"❌ Error searching vector store: {e}")
            return []

vectorstore = SupabaseVectorStore()

async def get_user_knowledge_bases(userid: str) -> List[str]:
    try:
        supabase = await get_supabase()

        # Query documents for this user and extract unique knowledge bases
        response = await supabase.table("document_vectors") \
            .select("metadata") \
            .like("metadata->>kb_identifier", f"{userid}_%") \
            .execute()

        knowledge_bases: Set[str] = set()
        userid_prefix = f"{userid}_"

        for row in response.data:
            metadata = row['metadata']
            if metadata and 'kb_identifier' in metadata:
                kb_identifier = metadata['kb_identifier']
                if kb_identifier and kb_identifier.startswith(userid_prefix):
                    kb_name = kb_identifier[len(userid_prefix):]
                    if kb_name:
                        knowledge_bases.add(kb_name)

        return sorted(list(knowledge_bases))

    except Exception as e:
        print(f"❌ Error fetching knowledge bases for user {userid}: {str(e)}")
        return []

async def get_kb_documents(userid: str, knowledge_base: str) -> List[dict]:
    """Get all documents in a specific knowledge base for a user"""
    try:
        supabase = await get_supabase()
        kb_identifier = f"{userid}_{knowledge_base}"

        # Query documents for this specific knowledge base
        response = await supabase.table("document_vectors") \
            .select("id, content, metadata") \
            .eq("metadata->>kb_identifier", kb_identifier) \
            .execute()

        # Group by filename and get unique documents
        documents_dict = {}
        for row in response.data:
            metadata = row['metadata']
            if metadata and 'source' in metadata:
                filename = metadata['source']
                if filename not in documents_dict:
                    documents_dict[filename] = {
                        'id': str(row['id']),
                        'filename': filename,
                        'knowledge_base': knowledge_base,
                        'upload_date': metadata.get('upload_date', 'Unknown')
                    }

        return list(documents_dict.values())

    except Exception as e:
        logger.error(f"❌ Error fetching documents for KB {knowledge_base}: {str(e)}")
        return []

async def delete_document_from_kb(userid: str, knowledge_base: str, filename: str) -> bool:
    """Delete all chunks of a specific document from a knowledge base"""
    try:
        supabase = await get_supabase()
        kb_identifier = f"{userid}_{knowledge_base}"

        # Delete all chunks of the document
        response = await supabase.table("document_vectors") \
            .delete() \
            .eq("metadata->>kb_identifier", kb_identifier) \
            .eq("metadata->>source", filename) \
            .execute()

        # Check if any rows were deleted
        if hasattr(response, 'data') and response.data is not None:
            deleted_count = len(response.data) if isinstance(response.data, list) else 1
            logger.info(f"✅ Deleted {deleted_count} chunks for document '{filename}' from KB '{knowledge_base}'")
            return True
        else:
            logger.warning(f"⚠️ No chunks found for document '{filename}' in KB '{knowledge_base}'")
            return False

    except Exception as e:
        logger.error(f"❌ Error deleting document '{filename}' from KB '{knowledge_base}': {str(e)}")
        return False

@tool
async def search_docs(query: str, config: RunnableConfig) -> str:
    """Search the knowledge base for relevant context within a specific knowledge base."""
    userid = config["configurable"].get("thread_id")
    knowledge_base = config["configurable"].get("knowledge_base")
    print(f"Searching for user: {userid}, knowledge_base: {knowledge_base}")

    kb_identifier = f"{userid}_{knowledge_base}"

    # Simplified - only filter by kb_identifier
    filter_conditions = {
        'kb_identifier': kb_identifier
    }

    docs = await vectorstore.similarity_search(query, k=4, filter_conditions=filter_conditions)

    for doc in docs:
        print(f"Found doc from KB: {doc.metadata.get('knowledge_base')}, Source: {doc.metadata.get('source')}")

    if not docs:
        return f"No relevant information found in knowledge base '{knowledge_base}' for this user."

    return "\n\n".join(
        f"[{doc.metadata.get('source', 'Unknown')} - KB: {doc.metadata.get('knowledge_base', 'Unknown')}]\n{doc.page_content.strip()}"
        for doc in docs
    )

if __name__ == "__main__":
    import asyncio

    async def test_search():
        print("🔍 Testing search_docs RAG tool with Supabase vector store...\n")

        test_user_id = "e2372654-dd60-4f0c-9af3-5ddd415b0beb"
        test_knowledge_base = "happy ki happy"

        while True:
            user_input = input("Enter a query (or 'exit'): ").strip()
            if user_input.lower() == "exit":
                break

            kb_input = input(f"Knowledge base (current: {test_knowledge_base}, press Enter to keep): ").strip()
            if kb_input:
                test_knowledge_base = kb_input

            try:
                result = await search_docs.ainvoke(
                    {"query": user_input},
                    config=RunnableConfig(
                        configurable={
                            "thread_id": test_user_id,
                            "knowledge_base": test_knowledge_base
                        }
                    )
                )
                print(f"\n📄 Results from '{test_knowledge_base}' knowledge base:\n")
                print(result)
                print("\n" + "="*50 + "\n")
            except Exception as e:
                print(f"❌ Error: {e}")

    asyncio.run(test_search())

# from langchain_qdrant import QdrantVectorStore
# from qdrant_client import QdrantClient
# from qdrant_client.http.models import Distance, VectorParams
# from qdrant_client.http.exceptions import UnexpectedResponse
# from typing_extensions import Annotated

# qdrant_client = QdrantClient(
#     host="localhost",  # or Qdrant Cloud URL
#     port=6333,
# )
# collection_name = "documents"
# try:
#     qdrant_client.get_collection(collection_name=collection_name)
# except UnexpectedResponse:
#     qdrant_client.create_collection(
#         collection_name=collection_name,
#         vectors_config=VectorParams(size=EMBEDDING_SIZE, distance=Distance.COSINE),
#     )

# vectorstore = QdrantVectorStore(
#     client=qdrant_client,
#     collection_name=collection_name,
#     embedding=embedding_model,
# )

# async def get_user_knowledge_bases(userid: str) -> List[str]:
#     try:
#         # Create filter to get all documents for this user
#         metadata_filter = Filter(
#             must=[
#                 FieldCondition(
#                     key="metadata.userid",
#                     match=MatchValue(value=userid)
#                 )
#             ]
#         )

#         # Use Qdrant client directly for better performance
#         scroll_result = qdrant_client.scroll(
#             collection_name=collection_name,
#             scroll_filter=metadata_filter,
#             limit=1000,
#             with_payload=True,
#             with_vectors=False
#         )

#         # Extract unique knowledge base names from kb_identifier
#         knowledge_bases: Set[str] = set()
#         userid_prefix = f"{userid}_"

#         for point in scroll_result[0]:
#             payload = point.payload
#             if payload and 'metadata' in payload:
#                 kb_identifier = payload['metadata'].get('kb_identifier')
#                 if kb_identifier and kb_identifier.startswith(userid_prefix):
#                     # Extract KB name by removing the userid_ prefix
#                     kb_name = kb_identifier[len(userid_prefix):]
#                     if kb_name:  # Make sure it's not empty
#                         knowledge_bases.add(kb_name)

#         return sorted(list(knowledge_bases))

#     except Exception as e:
#         print(f"❌ Error fetching knowledge bases for user {userid}: {str(e)}")
#         return []

# @tool
# def search_docs(query: str, config: RunnableConfig) -> str:
#     """Search the knowledge base for relevant context within a specific knowledge base."""
#     userid = config["configurable"].get("thread_id")
#     knowledge_base = config["configurable"].get("knowledge_base")
#     print(f"Searching for user: {userid}, knowledge_base: {knowledge_base}")

#     # Create knowledge base identifier by concatenating userid and knowledge_base
#     kb_identifier = f"{userid}_{knowledge_base}"

#     # Filter by both userid and knowledge_base using the combined identifier
#     metadata_filter = Filter(
#         must=[  # Changed from 'should' to 'must' to require both conditions
#             FieldCondition(
#                 key="metadata.userid",
#                 match=MatchValue(value=userid)
#             ),
#             FieldCondition(
#                 key="metadata.kb_identifier",
#                 match=MatchValue(value=kb_identifier)
#             )
#         ]
#     )

#     docs = vectorstore.similarity_search(query, k=4, filter=metadata_filter)

#     for doc in docs:
#         print(f"Found doc from KB: {doc.metadata.get('knowledge_base')}, Source: {doc.metadata.get('source')}")

#     if not docs:
#         return f"No relevant information found in knowledge base '{knowledge_base}' for this user."

#     return "\n\n".join(
#         f"[{doc.metadata.get('source', 'Unknown')} - KB: {doc.metadata.get('knowledge_base', 'Unknown')}]\n{doc.page_content.strip()}"
#         for doc in docs
#     )

# # ---------------------- Test Code ----------------------
# if __name__ == "__main__":
#     print("🔍 Testing search_docs RAG tool with knowledge base filtering...\n")

#     # Example test user ID and knowledge base
#     test_user_id = "e2372654-dd60-4f0c-9af3-5ddd415b0beb"
#     test_knowledge_base = "happy ki happy"  # Example knowledge base name

#     while True:
#         user_input = input("Enter a query (or 'exit'): ").strip()
#         if user_input.lower() == "exit":
#             break

#         # Optional: Allow changing knowledge base during testing
#         kb_input = input(f"Knowledge base (current: {test_knowledge_base}, press Enter to keep): ").strip()
#         if kb_input:
#             test_knowledge_base = kb_input

#         #try:
#             # Include both query and knowledge_base parameters
#         result = search_docs.invoke(
#             {
#                 "query": user_input,
#             },
#             config=RunnableConfig(configurable={"thread_id": test_user_id,"knowledge_base":test_knowledge_base})
#         )
#         print(f"\n📄 Results from '{test_knowledge_base}' knowledge base:\n")
#         print(result)
#         print("\n" + "="*50 + "\n")
#         #except Exception as e:
#             #print(f"❌ Error: {e}")
