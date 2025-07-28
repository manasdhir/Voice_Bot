from groq import AsyncGroq
from config import GROQ_API_KEY, ASR_MODEL, MURF_API_KEY
import soundfile as sf
import numpy as np
from huggingface_hub import hf_hub_download
from concurrent.futures import ThreadPoolExecutor
from murf import AsyncMurf


groq = AsyncGroq(api_key=GROQ_API_KEY)
executor = ThreadPoolExecutor(max_workers=4)

# kokoro_device = "cuda" if torch.cuda.is_available() else "cpu"
# kokoro_model = KModel().to(kokoro_device).eval()
# model_path = hf_hub_download(repo_id='hexgrad/Kokoro-82M', filename="kokoro-v1_0.pth")
# kokoro_model.load_state_dict(torch.load(model_path, map_location=kokoro_device), strict=False)
# kokoro_pipeline = KPipeline(lang_code='a', model=False)
# voice_path = hf_hub_download("hexgrad/Kokoro-82M", "voices/af_heart.pt")
# kokoro_voice = torch.load(voice_path, weights_only=True).to(kokoro_device)

async def groq_asr_bytes(audio_bytes: bytes, model: str = ASR_MODEL, language: str = "en") -> str:
    """Transcribes audio using Groq ASR."""
    # Groq client is already async, so we can use it directly
    resp = await groq.audio.transcriptions.create(
        model=model,
        file=("audio.wav", audio_bytes, "audio/wav"),
        response_format="text",
        language=language
    )
    return resp

murf_client = AsyncMurf(api_key=MURF_API_KEY)

async def murf_tts(text: str, voice_id: str = "en-IN-isha", format: str = "MP3") -> bytes:
    resp = murf_client.text_to_speech.stream(
        text=text,
        voice_id=voice_id,
        format=format,
        sample_rate=44100.0
    )
    chunks = [chunk async for chunk in resp]
    full_audio = b''.join(chunks)
    return full_audio











# def groq_tts(text: str, speed: float = 1.0) -> bytes:
#     try:
#         audio_segments = []
#         for _, ps, _ in kokoro_pipeline(text, kokoro_voice, speed):
#             ref_s = kokoro_voice[len(ps) - 1]
#             audio = kokoro_model(ps, ref_s, speed)
#             audio_np = audio.cpu().numpy().astype(np.float32)
#             audio_segments.append(audio_np)

#         full_audio = np.concatenate(audio_segments)

#         # Write to WAV bytes
#         buf = io.BytesIO()
#         sf.write(buf, full_audio, samplerate=24000, format="WAV", subtype="PCM_16")
#         buf.seek(0)
#         return buf.read()

#     except Exception as e:
#         print("Kokoro TTS synthesis failed")
#         raise RuntimeError(f"Kokoro TTS failed: {e}")


'''def groq_tts(text: str, model: str = TTS_MODEL, voice: str = TTS_VOICE) -> bytes:
    text = text[:1000]
    resp = groq.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format="wav"
    )
    print(resp.read()[:10])
    return resp.read()
    '''
   