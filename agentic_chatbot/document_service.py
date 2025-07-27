from fastapi import UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import pdfplumber
from rag_service import vectorstore
from config import CHUNK_SIZE, CHUNK_OVERLAP

def read_pdf(file: UploadFile) -> str:
    with pdfplumber.open(file.file) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    return text

async def process_document_upload(file: UploadFile, userid: str):
    try:
        filename = file.filename
        if not filename.lower().endswith(".pdf"):
            return {"error": "Only PDF files are supported"}

        # Read PDF
        with pdfplumber.open(file.file) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)

        # Chunk text
        splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
        chunks = splitter.split_text(text)

        # Batch create Document objects with metadata
        docs = [
            Document(page_content=chunk, metadata={"source": filename, "userid": userid})
            for chunk in chunks
        ]

        # ✅ Batch embed & insert
        vectorstore.add_documents(docs)

        return {"status": "uploaded", "chunks": len(docs), "file": filename}

    except Exception as e:
        return {"error": str(e)}
