import React from "react";
import VoiceBot from "../../components/voiceBot";

const ChatBot = () => {
  return (
    <div className="bg-gray-100 dark:bg-black w-full h-full rounded-l-2xl justify-center items-center flex flex-col text-neutral-700 dark:text-white">
      <VoiceBot />
    </div>
  );
};

export default ChatBot;
