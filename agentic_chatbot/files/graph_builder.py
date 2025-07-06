from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph.message import add_messages
from llm_provider import get_llm

class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

def build_graph(provider: str):
    llm = get_llm(provider)

    def chat_node(state: State):
        response = llm.invoke(state["messages"])
        return {"messages": [response]}  # LangGraph will append automatically

    builder = StateGraph(State)
    builder.add_node("chat", chat_node)
    builder.set_entry_point("chat")
    builder.set_finish_point("chat")

    return builder.compile()
