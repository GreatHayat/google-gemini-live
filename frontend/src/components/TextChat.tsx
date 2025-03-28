import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Wifi } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define types for our messages
interface Message {
  text: string;
  sender: "You" | "Gemini";
  timestamp: Date;
  // For streaming messages
  isComplete?: boolean;
}

function TextChat(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = new WebSocket("ws://127.0.0.1:5001/ws");

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established.");
      setIsConnected(true);
    };

    socketRef.current.onmessage = (event: MessageEvent) => {
      const data = event.data;

      // Check if this is a continuation of a streaming response
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];

        // If the last message is from Gemini and not complete, append to it
        if (
          lastMessage &&
          lastMessage.sender === "Gemini" &&
          !lastMessage.isComplete
        ) {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + data,
            // Check if this is the end of stream (you may need to implement a proper end-of-stream detection)
            isComplete: data.includes("END_OF_RESPONSE"), // Replace with your actual stream end marker
          };
          return updatedMessages;
        }

        // Otherwise, create a new message
        return [
          ...prevMessages,
          {
            text: data,
            sender: "Gemini",
            timestamp: new Date(),
            isComplete: data.includes("END_OF_RESPONSE"), // Replace with your actual stream end marker
          },
        ];
      });

      // Stop typing indicator
      setTimeout(() => setIsTyping(false), 500);
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
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const sendMessage = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      inputText.trim() !== ""
    ) {
      // Add user message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: inputText,
          sender: "You",
          timestamp: new Date(),
        },
      ]);

      // Send to server
      socketRef.current.send(inputText);

      // Show typing indicator
      setIsTyping(true);

      // Clear input
      setInputText("");

      // Focus input field
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat container */}
      <div className="max-w-4xl w-full mx-auto shadow-xl rounded-lg overflow-hidden h-full flex flex-col bg-white">
        {/* Header */}
        <header className="bg-violet-600 text-white py-4 px-6 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <MessageSquare size={20} className="text-violet-200" />
            <div>
              <h1 className="text-xl font-bold">Gemini Chat</h1>
              <div className="flex items-center text-xs text-violet-200 gap-1 mt-1">
                <Wifi
                  size={12}
                  className={isConnected ? "text-green-300" : "text-red-300"}
                />
                {isConnected ? "Connected to WebSocket" : "Disconnected"}
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare size={48} className="text-violet-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  Welcome to Gemini Chat
                </h3>
                <p className="text-gray-500 max-w-md mt-2">
                  Start a conversation by typing a message below.
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
                    className={`relative max-w-xs sm:max-w-md lg:max-w-lg rounded-t-2xl px-5 py-3.5 
                      ${
                        message.sender === "You"
                          ? "bg-violet-600 text-white rounded-l-2xl rounded-br-md"
                          : "bg-white border border-gray-200 shadow-sm rounded-r-2xl rounded-bl-md"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold text-sm ${
                          message.sender === "You"
                            ? "text-violet-200"
                            : "text-violet-600"
                        }`}
                      >
                        {message.sender}
                      </span>
                      <span
                        className={`text-xs ${
                          message.sender === "You"
                            ? "text-violet-200"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    {/* Apply Markdown for Gemini messages, regular text for user messages */}
                    {message.sender === "Gemini" ? (
                      <div className="prose prose-sm max-w-none prose-violet prose-code:text-violet-700 prose-pre:bg-gray-100 prose-headings:text-violet-900">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ ...props }) => (
                              <p className="my-2" {...props} />
                            ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {message.text}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-500 text-sm">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 rounded-full border-0 py-3 px-5 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all duration-200"
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={inputText.trim() === "" || !isConnected}
              className={`rounded-full p-3 text-white transition-all duration-200
                ${
                  inputText.trim() === "" || !isConnected
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                }`}
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TextChat;
