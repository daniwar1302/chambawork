"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to format text with bold, clickable links, and book buttons
function formatMessageText(text: string): React.ReactNode {
  // First, handle book buttons {{BOOK_BUTTON:name:link}}
  const bookButtonRegex = /\{\{BOOK_BUTTON:([^:]+):([^}]+)\}\}/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  // Find all book buttons and process text around them
  const textWithButtons = text;
  const buttonMatches: { index: number; length: number; name: string; link: string }[] = [];
  
  while ((match = bookButtonRegex.exec(textWithButtons)) !== null) {
    buttonMatches.push({
      index: match.index,
      length: match[0].length,
      name: match[1],
      link: match[2]
    });
  }
  
  if (buttonMatches.length === 0) {
    // No book buttons, process as before
    return processTextFormatting(text);
  }
  
  // Process text segments and buttons
  buttonMatches.forEach((btn, i) => {
    // Add text before this button
    if (btn.index > lastIndex) {
      const textBefore = text.substring(lastIndex, btn.index);
      segments.push(<span key={`text-${keyIndex++}`}>{processTextFormatting(textBefore)}</span>);
    }
    
    // Add the button
    segments.push(
      <a
        key={`book-btn-${i}`}
        href={btn.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 px-6 py-2.5 bg-[#c41e3a] hover:bg-[#a01830] text-white font-medium rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
      >
        📅 Book {btn.name}
      </a>
    );
    
    lastIndex = btn.index + btn.length;
  });
  
  // Add remaining text after last button
  if (lastIndex < text.length) {
    segments.push(<span key={`text-end-${keyIndex}`}>{processTextFormatting(text.substring(lastIndex))}</span>);
  }
  
  return segments;
}

// Helper to process bold and links (excluding book buttons)
function processTextFormatting(text: string): React.ReactNode {
  // Strip any markdown link formatting [text](url) -> url
  let cleanText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2');
  cleanText = cleanText.replace(/\]\(https?:\/\//g, ' https://');
  
  // Split by bold markers and URLs
  const combinedRegex = /(\*\*[^*]+\*\*|https?:\/\/[^\s\]\)]+|forms\.gle\/[^\s\]\)]+)/gi;
  
  const parts = cleanText.split(combinedRegex);
  const matchResult = cleanText.match(combinedRegex);
  const matches: string[] = matchResult ? Array.from(matchResult) : [];
  
  const result: React.ReactNode[] = [];
  let keyIndex = 0;
  
  parts.forEach((part) => {
    if (!part) return;
    
    if (matches.includes(part)) {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        result.push(
          <strong key={`bold-${keyIndex++}`} className="font-semibold">
            {boldText}
          </strong>
        );
      }
      else if (part.match(/^(https?:\/\/|forms\.gle\/)/i)) {
        const cleanUrl = part.replace(/[\]\)]+$/, '');
        const href = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
        result.push(
          <a
            key={`link-${keyIndex++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {cleanUrl}
          </a>
        );
      } else {
        result.push(part);
      }
    } else {
      result.push(part);
    }
  });
  
  return result;
}

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ConversationState {
  step: string;
  role?: "tutor" | "student";
  data: Record<string, string>;
}

interface ConversationMessage {
  role: "user" | "assistant" | "function";
  content: string;
  name?: string;
}

export default function LandingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    step: "greeting",
    data: {},
  });
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial welcome message when page loads
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Math.random().toString(36).substring(7),
        content: "¡Hola! 👋 Bienvenido a Chamba Tutorías.\n\nOfrecemos tutorías GRATUITAS con voluntarios.\n\n¿En qué te puedo ayudar?",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setQuickReplies(["Necesito ayuda con una materia 📚", "Quiero ser tutor voluntario 🎓"]);
    }
  }, [messages.length]);

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

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
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
    setInputValue("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationState,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.error) {
        addBotMessage("Lo siento, ocurrió un error. ¿Puedes intentar de nuevo?");
        return;
      }

      // Update state based on response type (AI or rule-based)
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }

      setTimeout(() => {
        addBotMessage(data.message, data.quickReplies || []);
      }, 500 + Math.random() * 500);
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      addBotMessage("Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickReply = (option: string) => {
    sendMessage(option);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-gray-200 bg-white z-10">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c41e3a] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Chamba
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 block -mt-0.5">
                Tutorías
              </span>
            </div>
          </Link>
        </nav>
      </header>

      {/* Main Chat Area - Scrollable */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 overflow-hidden">
        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4",
                  msg.isBot ? "justify-start" : "justify-start flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.isBot
                      ? "bg-[#c41e3a]"
                      : "bg-gray-200"
                  )}
                >
                  {msg.isBot ? (
                    <GraduationCap className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-gray-600 text-xs font-bold">Tú</span>
                  )}
                </div>
                
                {/* Message */}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.isBot
                      ? "bg-white text-gray-900 border border-gray-200 shadow-sm"
                      : "bg-[#c41e3a] text-white"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {formatMessageText(msg.content)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-[#c41e3a] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
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
      </main>

      {/* Fixed Bottom Section - Quick Replies, Input */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto w-full px-4">
          {/* Quick Replies */}
          {quickReplies.length > 0 && !isTyping && (
            <div className="flex flex-wrap gap-2 py-3">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-4 py-2 rounded-full border border-[#c41e3a]/30 text-[#c41e3a] text-sm hover:bg-[#c41e3a]/10 hover:border-[#c41e3a]/50 transition-all bg-white"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="py-3">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={isTyping}
                className="w-full px-5 py-4 pr-14 rounded-xl bg-white border border-gray-200 focus:border-[#c41e3a]/50 outline-none transition-all text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-[#c41e3a] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a01830] transition-all"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2025 Chamba Tutorías</p>
          <Link href="/admin" className="hover:text-[#c41e3a] transition-colors">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
