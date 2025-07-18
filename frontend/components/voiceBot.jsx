import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicVAD } from "@ricky0123/vad-web";
import { useAuth } from "../context/authContext";

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
  const { user, isSignedIn } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [volumeScale, setVolumeScale] = useState(1);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [connected, setConnected] = useState(false);

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

    ws.onopen = () => {
      console.log("🔌 WebSocket connected.");
      setConnected(true);

      // Send user ID only if user is logged in
      if (isSignedIn && user?.id) {
        const userInfo = {
          type: "user_info",
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(userInfo));
        console.log("👤 User info sent:", userInfo);
      } else {
        console.log("👤 Anonymous user connected");
      }
    };

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
        } else if (msg.type === "user_registered") {
          console.log("✅ User registered on server:", msg.message);
        } else if (msg.type === "error") {
          console.error("❌ Server error:", msg.message);
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

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected.");
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      setConnected(false);
    };

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
            // Send language info (include user_id only if logged in)
            const audioInfo = {
              lang: "english",
              ...(isSignedIn && user?.id && { user_id: user.id }),
            };
            wsRef.current.send(JSON.stringify(audioInfo));
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
    setVolumeScale(1);
    setUserSpeaking(false);
  };

  const handleStart = () => {
    if (!connected) {
      connectWebSocket();
      setMicOn(true);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setMicOn(false);
    setIsSpeaking(false);
    setUserSpeaking(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (botAudioRef.current) {
      botAudioRef.current.pause();
      botAudioRef.current = null;
    }
  };

  // Only handle mic state changes, no automatic WebSocket connection
  useEffect(() => {
    if (micOn) {
      startMic();
    } else {
      stopMic();
    }
    return () => stopMic();
  }, [micOn]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (botAudioRef.current) {
        botAudioRef.current.pause();
      }
      stopMic();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-8 p-8">
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
                  className="bg-orange-500 rounded-full w-[60px] h-[60px] shadow-lg"
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
              className="absolute bg-black dark:bg-white rounded-full h-[100px] w-[100px] shadow-lg"
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
              className="absolute bg-neutral-400 dark:bg-neutral-600 rounded-full h-[50px] w-[50px] shadow-md"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Conditional Sign-in Message */}
      {!isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="text-orange-400">🔒</span>
            <span>Sign in to unlock tools and knowledge base</span>
          </div>
        </motion.div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-4">
          <button
            onClick={handleStart}
            disabled={connected}
            className={`min-w-[120px] text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-200 ${
              connected
                ? "bg-green-600 cursor-not-allowed opacity-75"
                : "bg-orange-500 hover:bg-orange-600 hover:shadow-xl transform hover:scale-105"
            }`}
          >
            {connected ? "🔗 Connected" : "🎤 Start"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={!connected}
            className={`min-w-[120px] text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-200 ${
              !connected
                ? "bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed opacity-75"
                : "bg-red-500 hover:bg-red-600 hover:shadow-xl transform hover:scale-105"
            }`}
          >
            {!connected ? "⏹️ Disconnect" : "🔌 Disconnect"}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400" : "bg-neutral-400"
            }`}
          ></div>
          <span className="text-neutral-600 dark:text-neutral-400">
            {connected ? "Ready to listen" : "Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
}
