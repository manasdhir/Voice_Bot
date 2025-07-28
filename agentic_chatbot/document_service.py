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

async def process_document_upload(file: UploadFile, userid: str, knowledge_base: str):
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

        # Create knowledge base identifier by concatenating userid and knowledge_base
        kb_identifier = f"{userid}_{knowledge_base}"

        # Batch create Document objects with metadata including knowledge base
        docs = [
            Document(
                page_content=chunk, 
                metadata={
                    "source": filename, 
                    "userid": userid,
                    "knowledge_base": knowledge_base,
                    "kb_identifier": kb_identifier  # Combined identifier for filtering
                }
            )
            for chunk in chunks
        ]

        # ✅ Batch embed & insert
        vectorstore.add_documents(docs)

        return {
            "status": "uploaded", 
            "chunks": len(docs), 
            "file": filename,
            "knowledge_base": knowledge_base
        }

    except Exception as e:
        return {"error": str(e)}

