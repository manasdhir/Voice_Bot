from langgraph.graph import StateGraph, END, START
from langchain_core.messages import SystemMessage
from typing import TypedDict
from config import GEMINI_API_KEY
from rag_service import search_docs
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI

# State definition
class State(TypedDict):
    # add_messages is known as a reducer, where it does not modify the list but adds messages to it
    messages: Annotated[list,add_messages]
    #messages: Annotated[list[BaseMessage], add_messages]
    #both have same result no need to use BaseMessage

def create_graph():
    llm = ChatOpenAI(
    model="gemini-2.0-flash",
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",  # Any OpenAI-compatible endpoint
    temperature=0.7,
)
    #search_toool=TavilySearch(max_results=2)
    tools = [search_docs]
    llm_with_tools = llm.bind_tools(tools)
    async def llm_node(state: State):
        messages = state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}
    builder = StateGraph(State)
    builder.add_node("llm_with_tools", llm_node)
    tool_node = ToolNode(tools=tools)
    builder.add_node("tools", tool_node)
    builder.add_conditional_edges("llm_with_tools", tools_condition)
    builder.add_edge("tools", "llm_with_tools")
    builder.add_edge(START, "llm_with_tools")
    builder.add_edge("llm_with_tools", END)
    return builder.compile()
  

# Build basic graph (no tools, no memory)
def create_basic_graph():
    llm = ChatOpenAI(
    model="gemini-2.0-flash",
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",  # Any OpenAI-compatible endpoint
    temperature=0.7,
)
    async def llm_basic_node(state: State):
        messages = state["messages"]
        system_prompt=SystemMessage(content="""You are a helpful and friendly voice AI assistant. Your responses should be:

    - Conversational and natural, as if speaking to a friend
    - Concise but informative - aim for 1-3 sentences unless more detail is specifically requested
    - Clear and easy to understand when spoken aloud
    - Engaging and personable while remaining professional
    - Avoid overly complex language or long lists that are hard to follow in audio format

    When responding:
    - Use a warm, approachable tone
    - Speak in a natural rhythm suitable for text-to-speech
    - If you need to provide multiple items or steps, break them into digestible chunks
    - Ask clarifying questions when needed to better assist the user
    - Acknowledge when you don't know something rather than guessing

    Remember that users are interacting with you through voice, so structure your responses to be easily understood when heard rather than read.
    Dont use abbreviations or numerical content in your responses.""")
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages.insert(0, system_prompt)
        return {"messages": [llm.invoke(messages)]}
    builder = StateGraph(State)
    builder.add_node("llm_basic", llm_basic_node)
    builder.set_entry_point("llm_basic")
    builder.add_edge("llm_basic", END)
    return builder.compile()  # No checkpointing




