from qdrant_client import QdrantClient

# Connect to Qdrant server
qdrant_client = QdrantClient(host="localhost", port=6333)
collection_name = "documents"

all_points = []
scroll_offset = None

while True:
    points, scroll_offset = qdrant_client.scroll(
        collection_name=collection_name,
        scroll_filter=None,
        offset=scroll_offset,
        limit=100,
        with_payload=True,
        with_vectors=False  # ⛔ Do not fetch vectors
    )
    all_points.extend(points)
    if scroll_offset is None:
        break

# 🔍 Print actual content and metadata
for i, point in enumerate(all_points, start=1):
    payload = point.payload or {}
    content = payload.get("page_content") or payload.get("text") or "[No content found]"
    metadata = payload.get("metadata", payload)  # in case metadata is flattened
    
    
    print(type(metadata['userid']))
    break