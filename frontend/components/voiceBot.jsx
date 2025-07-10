import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicVAD } from "@ricky0123/vad-web";

const blobs = [0, 1, 2, 3];

const blobVariants = {
  animate: (i) => ({
    scaleY: [1, 1.8, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.2,
    },
  }),
  idle: {
    scaleY: 1,
  },
};

export default function VoiceBot() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [volumeScale, setVolumeScale] = useState(1);
  const [userSpeaking, setUserSpeaking] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  const vadRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const botAudioRef = useRef(null);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/stream");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => console.log("🔌 WebSocket connected.");

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        const msg = JSON.parse(event.data);
        if (msg.type === "transcription") {
          console.log("📝 Transcription:", msg.text);
        } else if (msg.type === "llm_response") {
          console.log("🤖 Bot:", msg.text);
        } else if (msg.type === "tts_start") {
          setIsSpeaking(true);
        } else if (msg.type === "tts_end") {
          setIsSpeaking(false);
        }
      } else {
        if (botAudioRef.current) {
          botAudioRef.current.pause();
          botAudioRef.current = null;
        }

        const audioBlob = new Blob([event.data], { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        botAudioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          console.log("🔊 Bot audio started");
        };

        audio.onended = () => {
          setIsSpeaking(false);
          botAudioRef.current = null;
          console.log("🔇 Bot audio ended");
        };

        audio.onerror = (e) => {
          console.error("🔈 Audio error", e);
          setIsSpeaking(false);
        };

        await audio.play();
      }
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected.");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    wsRef.current = ws;
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;

      const dataArray = new Uint8Array(analyser.fftSize);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      const vad = await MicVAD.new({
        source: stream,
        onSpeechStart: () => {
          console.log("🟢 Speech started");
          setUserSpeaking(true);
          chunksRef.current = [];

          // Interrupt bot audio
          if (botAudioRef.current) {
            botAudioRef.current.pause();
            botAudioRef.current = null;
            setIsSpeaking(false);
          }

          mediaRecorderRef.current?.start();
        },
        onSpeechEnd: () => {
          console.log("🔴 Speech ended");
          setUserSpeaking(false);
          mediaRecorderRef.current?.stop();
        },
      });

      await vad.start();
      vadRef.current = vad;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const buffer = reader.result;
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ lang: "english" }));
            wsRef.current.send(buffer);
          }
        };
        reader.readAsArrayBuffer(blob);
      };

      const animateLive = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] - 128;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const scale = 1 + Math.min(rms / 30, 1.2);
        setVolumeScale(scale);
        rafRef.current = requestAnimationFrame(animateLive);
      };

      animateLive();
    } catch (err) {
      console.error("❌ Mic/VAD error:", err);
      setMicOn(false);
    }
  };

  const stopMic = async () => {
    cancelAnimationFrame(rafRef.current);

    if (vadRef.current) {
      await vadRef.current.pause();
      await vadRef.current.destroy();
      vadRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    if (micOn) startMic();
    else stopMic();
    return () => stopMic();
  }, [micOn]);

  return (
    <div className="flex flex-col items-center justify-center h-60 w-full bg-black gap-6">
      <div className="relative h-[120px] w-full flex items-center justify-center">
        {/* Bot speaking animation */}
        <AnimatePresence mode="wait">
          {isSpeaking && (
            <motion.div
              key="bot-speaking"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute flex items-end gap-3"
            >
              {blobs.map((b, i) => (
                <motion.div
                  key={b}
                  className="bg-white rounded-full w-[60px] h-[60px]"
                  custom={i}
                  variants={blobVariants}
                  animate="animate"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User speaking animation */}
        <AnimatePresence mode="wait">
          {userSpeaking && !isSpeaking && (
            <motion.div
              key="user-speaking"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ scale: volumeScale, opacity: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bg-white rounded-full h-[100px] w-[100px]"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </AnimatePresence>

        {/* Idle animation */}
        <AnimatePresence>
          {!userSpeaking && !isSpeaking && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bg-white rounded-full h-[50px] w-[50px]"
            />
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setMicOn((prev) => !prev)}
        className={`text-white px-4 py-2 rounded ${
          micOn ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {micOn ? "Stop Mic" : "Start Mic"}
      </button>
    </div>
  );
}
