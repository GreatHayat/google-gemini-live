import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, Volume2, User } from "lucide-react";

interface Message {
  text: string;
  sender: "You" | "Gemini";
  isAudio?: boolean;
}

function AudioChat(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://127.0.0.1:5001/audio_chat");
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established.");
      setIsConnected(true);
    };

    socketRef.current.onmessage = async (event: MessageEvent) => {
      const arrayBuffer = await event.data.arrayBuffer();
      audioContextRef.current?.decodeAudioData(arrayBuffer, (buffer) => {
        audioBuffersRef.current.push(buffer);
        if (!isPlayingRef.current) {
          playAudioChunks();
        }
      });

      // Only add a new message if this is the first audio chunk in a sequence
      setMessages((prevMessages) => {
        // Check if the last message is already an audio message from Gemini
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (
          lastMessage &&
          lastMessage.sender === "Gemini" &&
          lastMessage.isAudio
        ) {
          // Don't add a new message, just return the current messages
          return prevMessages;
        } else {
          // This is the first audio chunk, add a new message
          return [
            ...prevMessages,
            {
              text: "Audio response",
              sender: "Gemini",
              isAudio: true,
            },
          ];
        }
      });

      // Update UI playing state
      setIsPlaying(true);
    };

    socketRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
      setIsConnected(false);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playAudioChunks = () => {
    if (audioBuffersRef.current.length > 0) {
      isPlayingRef.current = true;
      setIsPlaying(true);

      const buffer = audioBuffersRef.current.shift(); // Remove the first chunk
      if (!buffer || !audioContextRef.current) return;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        // Only set isPlaying to false if no more chunks
        if (audioBuffersRef.current.length === 0) {
          setIsPlaying(false);
        }
        playAudioChunks(); // Play the next chunk (if any)
      };
      source.start();
    } else {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const sendMessage = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      inputText.trim() !== ""
    ) {
      socketRef.current.send(inputText);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: inputText, sender: "You" },
      ]);
      setInputText("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat container */}
      <div className="max-w-4xl w-full mx-auto shadow-xl rounded-lg overflow-hidden h-full flex flex-col bg-white">
        {/* Header */}
        <header className="bg-purple-600 text-white py-4 px-6 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <Volume2 size={24} className="text-purple-200" />
            <div>
              <h1 className="text-xl font-bold">Audio Chat</h1>
              <div className="flex items-center text-xs text-purple-200 gap-1 mt-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                ></span>
                {isConnected ? "Connected to Audio Service" : "Disconnected"}
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Mic size={48} className="text-purple-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  Welcome to Audio Chat
                </h3>
                <p className="text-gray-500 max-w-md mt-2">
                  Type your message and receive audio responses
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "You" ? "justify-end" : "justify-start"
                  } group`}
                >
                  <div
                    className={`relative max-w-xs sm:max-w-md rounded-2xl px-5 py-3 
                      ${
                        message.sender === "You"
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-white border border-gray-200 shadow-sm rounded-bl-none"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === "You" ? (
                        <User size={16} className="text-purple-200" />
                      ) : (
                        <Volume2
                          size={16}
                          className={`${
                            isPlaying && message.isAudio
                              ? "animate-pulse text-purple-600"
                              : "text-purple-600"
                          }`}
                        />
                      )}
                      <span
                        className={`font-semibold text-sm ${
                          message.sender === "You"
                            ? "text-purple-200"
                            : "text-purple-600"
                        }`}
                      >
                        {message.sender}
                      </span>
                    </div>

                    <div className="mt-1">
                      {message.sender === "You" ? (
                        <div className="whitespace-pre-wrap break-words">
                          {message.text}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-full ${
                              message.isAudio ? "" : "hidden"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-gray-700">
                                {message.text}
                              </div>
                              <div
                                className={`relative w-16 h-4 ${
                                  isPlaying && message.isAudio ? "" : "hidden"
                                }`}
                              >
                                <div className="absolute inset-0 flex items-center justify-around">
                                  <div className="w-1 bg-purple-600 h-1 rounded-full animate-sound-wave-1"></div>
                                  <div className="w-1 bg-purple-600 h-2 rounded-full animate-sound-wave-2"></div>
                                  <div className="w-1 bg-purple-600 h-3 rounded-full animate-sound-wave-3"></div>
                                  <div className="w-1 bg-purple-600 h-2 rounded-full animate-sound-wave-2"></div>
                                  <div className="w-1 bg-purple-600 h-1 rounded-full animate-sound-wave-1"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={`${message.isAudio ? "hidden" : ""}`}>
                            {message.text}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 rounded-full border-0 py-3 px-5 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={inputText.trim() === "" || !isConnected}
              className={`rounded-full p-3 text-white transition-all duration-200
                ${
                  inputText.trim() === "" || !isConnected
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                }`}
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom animation keyframes (would go in your global CSS) */}
      <style>{`
        @keyframes sound-wave-1 {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 8px;
          }
        }
        @keyframes sound-wave-2 {
          0%,
          100% {
            height: 8px;
          }
          50% {
            height: 16px;
          }
        }
        @keyframes sound-wave-3 {
          0%,
          100% {
            height: 12px;
          }
          50% {
            height: 20px;
          }
        }
        .animate-sound-wave-1 {
          animation: sound-wave-1 0.5s infinite;
        }
        .animate-sound-wave-2 {
          animation: sound-wave-2 0.5s infinite;
        }
        .animate-sound-wave-3 {
          animation: sound-wave-3 0.5s infinite;
        }
      `}</style>
    </div>
  );
}

export default AudioChat;
