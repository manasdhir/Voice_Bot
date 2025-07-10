import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MicVAD } from "@ricky0123/vad-web";

const blobs = [0, 1, 2, 3];

export default function VoiceBot() {
  const [isSpeaking, setIsSpeaking] = useState(false); // bot speaking
  const [micOn, setMicOn] = useState(false); // mic toggle
  const [volumeScale, setVolumeScale] = useState(1); // for animation scale

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  const vadRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startMic = async () => {
    try {
      console.log("🎙️ Requesting mic...");
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

      // Start VAD
      const vad = await MicVAD.new({
        source: stream,
        onSpeechStart: () => console.log("🟢 Speech started"),
        onSpeechEnd: () => console.log("🔴 Speech ended"),
      });
      await vad.start();
      vadRef.current = vad;

      // Start recorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        // Auto-download the file
        const a = document.createElement("a");
        a.href = url;
        a.download = "voice-test.webm";
        a.click();

        console.log("⬇️ Audio downloaded");

        // Playback + animate
        const audio = new Audio(url);
        const audioContext2 = new AudioContext();
        const track = audioContext2.createMediaElementSource(audio);
        const analyser2 = audioContext2.createAnalyser();
        analyser2.fftSize = 1024;

        const dataArray2 = new Uint8Array(analyser2.fftSize);
        track.connect(analyser2);
        analyser2.connect(audioContext2.destination);

        setIsSpeaking(true);

        const animatePlayback = () => {
          analyser2.getByteTimeDomainData(dataArray2);
          let sumSquares = 0;
          for (let i = 0; i < dataArray2.length; i++) {
            const val = dataArray2[i] - 128;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / dataArray2.length);
          const scale = 1 + Math.min(rms / 30, 1.2);
          setVolumeScale(scale);

          rafRef.current = requestAnimationFrame(animatePlayback);
        };

        audio.onplay = () => animatePlayback();
        audio.onended = () => {
          cancelAnimationFrame(rafRef.current);
          setIsSpeaking(false);
          audioContext2.close();
        };

        audio.play();
      };

      recorder.start();
      console.log("▶️ Recording started");

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
    console.log("🛑 Stopping mic");
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
    if (micOn) startMic();
    else stopMic();
    return () => stopMic();
  }, [micOn]);

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
  };

  return (
    <div className="flex flex-col items-center justify-center h-60 w-full bg-black gap-6">
      <div
        onClick={() => setIsSpeaking((prev) => !prev)}
        className="cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="blobs"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex items-end gap-3"
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
          ) : (
            <motion.div
              key="circle"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ scale: volumeScale, opacity: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="bg-white rounded-full h-[100px] w-[100px]"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
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
