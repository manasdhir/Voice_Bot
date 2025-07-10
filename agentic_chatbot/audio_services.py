from groq import Groq
import tempfile
import os
from config import GROQ_API_KEY, ASR_MODEL, TTS_MODEL, TTS_VOICE

groq = Groq(api_key=GROQ_API_KEY)

def groq_asr_bytes(audio_bytes: bytes, model: str = ASR_MODEL, language: str = "en") -> str:
    resp = groq.audio.transcriptions.create(
        model=model,
        file=("audio.wav", audio_bytes, "audio/wav"),
        response_format="text",
        language=language
    )
    return resp

def groq_tts(text: str, model: str = TTS_MODEL, voice: str = TTS_VOICE) -> bytes:
    text = text[:1000]
    resp = groq.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format="wav"
    )
    if hasattr(resp, "read"):
        return resp.read()
    elif hasattr(resp, "content"):
        return resp.content
    elif isinstance(resp, (bytes, bytearray)):
        return bytes(resp)
    else:
        tf = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        resp.write_to_file(tf.name)
        tf.close()
        data = open(tf.name, "rb").read()
        os.remove(tf.name)
        return data
