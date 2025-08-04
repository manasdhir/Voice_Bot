---
title: "Voice Bot Murf"
emoji: "🎙️"
colorFrom: "blue"
colorTo: "purple"
sdk: "gradio"
---

# Voice Bot Murf

A voice-enabled assistant built with ASR, LLMs, and TTS. This Space uses a Gradio frontend to capture user audio, transcribe it, send it to a language model, and speak back the response.

## Features

- Speech-to-text (ASR)
- Large language model backend for understanding and response generation
- Text-to-speech (TTS) output
- Real-time interaction via Gradio

## Usage

This Space is self-contained. Just hit **Run** and start speaking. The pipeline does the following:

1. Captures voice input from your microphone.
2. Converts audio to text using ASR.
3. Sends the transcription to the language model.
4. Synthesizes the answer back as speech using TTS.

## Example (inside the app)

```python
import gradio as gr

def voice_chat(audio):
    transcription = asr_model.transcribe(audio)
    answer = llm.generate_answer(transcription)
    speech = tts.synthesize(answer)
    return answer, speech

iface = gr.Interface(
    fn=voice_chat,
    inputs=gr.Audio(source="microphone", type="filepath"),
    outputs=[gr.Textbox(label="Response"), gr.Audio(label="Spoken Answer")],
)
iface.launch()
