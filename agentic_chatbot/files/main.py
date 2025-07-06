from typing import Dict
from fastapi import FastAPI
from uuid import uuid4
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import BaseMessage

from graph_builder import build_graph
from schema import ChatRequest, ChatResponse

app = FastAPI()

session_memory: Dict[str, list[BaseMessage]] = {}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid4())

    if session_id not in session_memory:
        session_memory[session_id] = []

    session_messages = session_memory[session_id]
    print(session_memory)
    # Start state
    state = {
        "messages": session_messages + [HumanMessage(content=request.message)]
    }

    graph = build_graph(request.provider)
    result = graph.invoke(state, config=RunnableConfig())

    session_memory[session_id] = result["messages"]

    return ChatResponse(session_id=session_id, reply=result["messages"][-1].content)
