import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel

load_dotenv()

def _get_env_var_or_fail(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise RuntimeError(f"Environment variable '{var_name}' is required for this provider.")
    return value

def get_llm(provider: str = "openai") -> BaseChatModel:
    provider = provider.lower()

    if provider == "openai":
        return ChatOpenAI(
            model="gpt-4",
            api_key=_get_env_var_or_fail("OPENAI_API_KEY")
        )

    elif provider == "ollama":
        return ChatOpenAI(
            model="llama3",
            base_url="http://localhost:11434/v1",
            api_key="ollama"  # dummy
        )

    elif provider == "together":
        return ChatOpenAI(
            model="mistralai/Mistral-7B-Instruct-v0.1",
            base_url="https://api.together.xyz/v1",
            api_key=_get_env_var_or_fail("TOGETHER_API_KEY")
        )

    elif provider == "openrouter":
        return ChatOpenAI(
            model="openai/gpt-3.5-turbo",  # or any model from OpenRouter
            base_url="https://openrouter.ai/api/v1",
            api_key=_get_env_var_or_fail("OPENROUTER_API_KEY")
        )

    elif provider == "groq":
        return ChatOpenAI(
            model="llama3-70b-8192",
            base_url="https://api.groq.com/openai/v1",
            api_key=_get_env_var_or_fail("GROQ_API_KEY")
        )

    elif provider == "fireworks":
        return ChatOpenAI(
            model="accounts/fireworks/models/mixtral-8x7b-instruct",
            base_url="https://api.fireworks.ai/inference/v1",
            api_key=_get_env_var_or_fail("FIREWORKS_API_KEY")
        )

    elif provider == "lmstudio":
        return ChatOpenAI(
            model="llama3",
            base_url="http://localhost:1234/v1",
            api_key="lmstudio"  # dummy
        )

    elif provider == "vllm":
        return ChatOpenAI(
            model="mistral",
            base_url="http://localhost:8000/v1",
            api_key="vllm"  # dummy
        )

    else:
        raise ValueError(f"Unsupported provider: {provider}")
