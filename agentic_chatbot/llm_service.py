from langgraph.graph import StateGraph, END, START
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from typing import TypedDict, List, Union
from config import GROQ_API_KEY, LLM_MODEL_NAME
from rag_service import search_docs
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

# State definition
class State(TypedDict):
    # add_messages is known as a reducer, where it does not modify the list but adds messages to it
    messages: Annotated[list,add_messages]
    #messages: Annotated[list[BaseMessage], add_messages]
    #both have same result no need to use BaseMessage

# Initialize LLM
llm = ChatGroq(
    model_name=LLM_MODEL_NAME,
    api_key=GROQ_API_KEY,
    temperature=0.7,
)

# System message for voicebot behavior
system_prompt = SystemMessage(content="You are an AI voice assistant. Respond in a friendly, conversational tone.")
search_toool=TavilySearch(max_results=2)
tools=[search_toool, search_docs]
llm_with_tools=llm.bind_tools(tools)

# LLM node
def llm_node(state:State):
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages.insert(0, system_prompt)
    return {"messages":[llm_with_tools.invoke(state["messages"])]}  # ✅ Only return new message


# Build the graph
def create_graph():
    memory = MemorySaver() 
    builder = StateGraph(State)
    builder.add_node("llm_with_tools", llm_node)
    tool_node=ToolNode(tools=tools)
    builder.add_node("tools",tool_node)
    builder.add_conditional_edges("llm_with_tools", tools_condition)
    builder.add_edge("tools","llm_with_tools")
    builder.add_edge(START, "llm_with_tools")

    builder.add_edge("llm_with_tools", END)
    return builder.compile(checkpointer=memory)

# Create the graph instance
graph = create_graph()

if __name__ == "__main__":
    try:
        # Save the graph image
        with open("graph.png", "wb") as f:
            f.write(graph.get_graph().draw_mermaid_png())
        print("✅ Graph saved as 'graph.png'")
    except Exception as e:
        print("❌ Failed to render/save graph image.")
        print("Error:", e)

    # 🔍 Test tool invocation with a user prompt
    from langchain_core.messages import HumanMessage

    # Define a tool-activating test prompt
    test_prompt = HumanMessage(content="search about AI project proposal and give me a brief")

    # Run the graph
    inputs = {"messages": [test_prompt]}
    config={"configurable":{"thread_id":"1"}}
    for output in graph.stream(inputs,config=config):
        print("\n--- Step Output ---")
        print(output)
    
    print("\n✅ Graph execution complete.")
