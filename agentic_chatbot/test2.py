from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Assuming you already have a Qdrant client
client = QdrantClient(host="localhost", port=6333)

userid = "e6184db0-6c6f-4e0e-961a-5e55a6c5b3c7"

# Define metadata-only filter
metadata_filter = Filter(
    should=[
        FieldCondition(
            key="metadata.userid",
            match=MatchValue(value=userid)
        )
    ]
)

# Run metadata-only filtering (no vector search)
scroll_result = client.scroll(
    collection_name="documents",  # your collection name
    scroll_filter=metadata_filter,
    limit=100,  # fetch 100 matching points
    with_payload=True,
    with_vectors=False
)

# Access matching docs
for point in scroll_result[0]:
    print(f"📄 ID: {point.id}")
    print(f"📄 Payload: {point.payload}")
