"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { QuickReplies } from "./quick-replies";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ConversationState {
  step: string;
  role?: "provider" | "requester";
  data: Record<string, string>;
}

const INITIAL_STATE: ConversationState = {
  step: "greeting",
  data: {},
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_STATE);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((content: string, replies: string[] = []) => {
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      content,
      isBot: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    setQuickReplies(replies);
    setIsTyping(false);
  }, []);

  // Initial greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage(
          "¡Hola! 👋 Soy tu asistente de Chamba.\n\n¿En qué te puedo ayudar hoy?",
          ["Busco una manicurista 💅", "Soy proveedora de servicios"]
        );
      }, 800);
    }
  }, [isOpen, messages.length, addBotMessage]);

  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      content,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuickReplies([]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId,
          conversationState,
        }),
      });

      const data = await response.json();

      if (data.error) {
        addBotMessage("Lo siento, ocurrió un error. ¿Puedes intentar de nuevo?");
        return;
      }

      // Update conversation state
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }

      // Add bot response with typing delay
      setTimeout(() => {
        addBotMessage(data.message, data.quickReplies || []);
      }, 500 + Math.random() * 500);
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      addBotMessage("Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?");
    }
  };

  const handleQuickReply = (option: string) => {
    sendMessage(option);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300",
        isMinimized ? "w-80 h-14" : "w-96 h-[600px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Chamba</h3>
            <p className="text-xs text-white/80">
              {isTyping ? "Escribiendo..." : "En línea"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                isBot={msg.isBot}
                timestamp={msg.timestamp}
              />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <QuickReplies
            options={quickReplies}
            onSelect={handleQuickReply}
            disabled={isTyping}
          />

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={isTyping} />
        </>
      )}
    </div>
  );
}

