"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, BookOpen, Brain, Globe, Code, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneInput, usePhoneInput } from "@/components/ui/phone-input";

// Helper function to convert URLs in text to clickable links
function linkifyText(text: string): React.ReactNode {
  // Regex to match URLs (with or without protocol)
  const urlRegex = /(https?:\/\/[^\s]+|forms\.gle\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  const result: React.ReactNode[] = [];
  let matchIndex = 0;
  
  parts.forEach((part, index) => {
    if (part) {
      // Check if this part is a URL
      if (matches.includes(part)) {
        const href = part.startsWith('http') ? part : `https://${part}`;
        result.push(
          <a
            key={`link-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        );
        matchIndex++;
      } else {
        result.push(part);
      }
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

// Auth flow states
type AuthStep = "phone" | "otp" | "authenticated";

export default function LandingPage() {
  const { data: session, update: updateSession } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    step: "greeting",
    data: {},
  });
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auth state
  const [authStep, setAuthStep] = useState<AuthStep>(session ? "authenticated" : "phone");
  const [pendingPhone, setPendingPhone] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  // Phone input with country code selector
  const { phone: phoneNumber, setPhone: setPhoneNumber, countryCode, setCountryCode, fullNumber, isValid: isPhoneValid } = usePhoneInput("GT");
  
  // Update auth step when session changes
  useEffect(() => {
    if (session) {
      setAuthStep("authenticated");
    }
  }, [session]);

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

  // Handle phone submission for auth
  const handlePhoneSubmit = async () => {
    if (!isPhoneValid || !fullNumber) return;
    
    setIsAuthLoading(true);
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPendingPhone(fullNumber);
        setAuthStep("otp");
        setOtpCode(""); // Clear OTP input
      } else {
        alert(data.error || "Error al enviar código");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Error al enviar código. Intenta de nuevo.");
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  // Handle OTP verification
  const handleOtpSubmit = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) return;
    
    setIsAuthLoading(true);
    
    try {
      // First verify OTP via our API
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code: otpCode }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        // Now sign in with NextAuth using the phone-otp provider
        const signInResult = await signIn("phone-otp", {
          phone: pendingPhone,
          code: otpCode,
          redirect: false,
        });
        
        if (signInResult?.ok) {
          setAuthStep("authenticated");
          setInputValue(""); // Clear input for chat
          await updateSession();
        } else {
          alert("Error al iniciar sesión");
        }
      } else {
        alert(verifyData.error || "Código inválido");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Error al verificar código. Intenta de nuevo.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setHasStarted(true);
    
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
          
          {/* Only show account link when logged in */}
          {session && (
            <div className="flex items-center gap-3">
              <Link href={session.user.role === "TUTOR" ? "/tutor/dashboard" : "/estudiante/solicitudes"}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Mi cuenta
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Chat Area - Scrollable */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 overflow-hidden">
        {/* Phone Auth Flow - Show first if not authenticated and not started */}
        {!session && !hasStarted && authStep !== "authenticated" ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c41e3a]/10 border border-[#c41e3a]/20 mb-6">
                <span className="w-2 h-2 bg-[#c41e3a] rounded-full animate-pulse" />
                <span className="text-[#c41e3a] text-sm font-medium">100% Gratuito</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                Aprende sin
                <span className="block text-[#c41e3a]">límites</span>
              </h1>
              <p className="text-gray-500 text-lg md:text-xl max-w-md mx-auto">
                Conectamos estudiantes con tutores voluntarios para tutorías personalizadas en línea
              </p>
            </div>
            
            {authStep === "phone" ? (
              /* Phone Input Step */
              <div className="w-full max-w-sm">
                <p className="text-center text-gray-600 mb-4 text-sm">
                  Ingresa tu número para comenzar
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePhoneSubmit();
                  }}
                  className="space-y-4"
                >
                  <PhoneInput
                    id="phone-landing"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    countryCode={countryCode}
                    onCountryChange={setCountryCode}
                    disabled={isAuthLoading}
                    className="shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!isPhoneValid || isAuthLoading}
                    className="w-full py-4 rounded-xl bg-[#c41e3a] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a01830] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c41e3a]/25"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Te enviaremos un código por SMS para verificar
                </p>
                
                {/* Guest Mode Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setHasStarted(true);
                      addBotMessage(
                        "¡Hola! 👋 Bienvenido a Chamba Tutorías.\n\nEstás explorando como invitado. Puedo ayudarte a:\n\n• Buscar tutores disponibles\n• Conocer las materias que ofrecemos\n• Responder tus preguntas\n\n¿En qué materia necesitas ayuda?",
                        ["Matemáticas 📐", "Ciencias 🧪", "Inglés 🗣️", "Otra materia"]
                      );
                    }}
                    className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar como invitado
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Explora sin registrarte
                  </p>
                </div>
              </div>
            ) : authStep === "otp" ? (
              /* OTP Verification Step */
              <div className="w-full max-w-sm">
                <p className="text-center text-gray-600 mb-2 text-sm">
                  Código enviado a
                </p>
                <p className="text-center text-[#c41e3a] font-mono font-medium mb-6">
                  {pendingPhone}
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleOtpSubmit();
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      disabled={isAuthLoading}
                      maxLength={6}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-gray-300 focus:bg-white focus:border-[#c41e3a] outline-none transition-all text-gray-900 placeholder:text-gray-300 disabled:opacity-50 text-center text-3xl tracking-[0.5em] font-mono shadow-sm"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || isAuthLoading}
                    className="w-full py-4 rounded-xl bg-[#c41e3a] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a01830] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c41e3a]/25"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verificar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      setAuthStep("phone");
                      setOtpCode("");
                    }}
                    className="text-sm text-gray-400 hover:text-[#c41e3a] transition-colors"
                  >
                    ← Cambiar número
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      setHasStarted(true);
                      addBotMessage(
                        "¡Hola! 👋 Bienvenido a Chamba Tutorías.\n\nEstás explorando como invitado. Puedo ayudarte a:\n\n• Buscar tutores disponibles\n• Conocer las materias que ofrecemos\n• Responder tus preguntas\n\n¿En qué materia necesitas ayuda?",
                        ["Matemáticas 📐", "Ciencias 🧪", "Inglés 🗣️", "Otra materia"]
                      );
                    }}
                    className="text-sm text-gray-400 hover:text-[#c41e3a] transition-colors"
                  >
                    Continuar como invitado →
                  </button>
                </div>
              </div>
            ) : null}
            
            {/* Subject icons strip */}
            <div className="flex items-center gap-6 mt-16 text-gray-300">
              <BookOpen className="w-5 h-5" />
              <Brain className="w-5 h-5" />
              <Globe className="w-5 h-5" />
              <Code className="w-5 h-5" />
            </div>
          </div>
        ) : !hasStarted ? (
          /* Authenticated - Show subject options */
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                ¡Hola{session?.user?.name ? `, ${session.user.name}` : ""}!
              </h1>
              <p className="text-gray-500 text-lg">
                ¿En qué materia necesitas ayuda hoy?
              </p>
            </div>
            
            {/* Subject Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-10">
              <button
                onClick={() => handleQuickReply("Necesito ayuda con Matemáticas")}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c41e3a]/50 hover:shadow-lg hover:shadow-[#c41e3a]/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#c41e3a]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c41e3a]/20 transition-all" />
                <Brain className="w-8 h-8 text-[#c41e3a] mb-3" />
                <p className="font-semibold text-gray-900 text-sm">Matemáticas</p>
                <p className="text-gray-400 text-xs mt-1">Álgebra, Cálculo, Geometría</p>
              </button>
              
              <button
                onClick={() => handleQuickReply("Necesito ayuda con Ciencias")}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c41e3a]/50 hover:shadow-lg hover:shadow-[#c41e3a]/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#c41e3a]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c41e3a]/20 transition-all" />
                <BookOpen className="w-8 h-8 text-[#c41e3a] mb-3" />
                <p className="font-semibold text-gray-900 text-sm">Ciencias</p>
                <p className="text-gray-400 text-xs mt-1">Física, Química, Biología</p>
              </button>
              
              <button
                onClick={() => handleQuickReply("Necesito ayuda con Inglés")}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c41e3a]/50 hover:shadow-lg hover:shadow-[#c41e3a]/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#c41e3a]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c41e3a]/20 transition-all" />
                <Globe className="w-8 h-8 text-[#c41e3a] mb-3" />
                <p className="font-semibold text-gray-900 text-sm">Inglés</p>
                <p className="text-gray-400 text-xs mt-1">Gramática, Conversación</p>
              </button>
              
              <button
                onClick={() => handleQuickReply("Necesito ayuda con otra materia")}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c41e3a]/50 hover:shadow-lg hover:shadow-[#c41e3a]/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#c41e3a]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c41e3a]/20 transition-all" />
                <Code className="w-8 h-8 text-[#c41e3a] mb-3" />
                <p className="font-semibold text-gray-900 text-sm">Otra</p>
                <p className="text-gray-400 text-xs mt-1">Programación, Historia...</p>
              </button>
            </div>
            
            {/* Tutor CTA */}
            <button
              onClick={() => {
                setHasStarted(true);
                addBotMessage(
                  "¡Qué bueno que quieres ayudar! 🎓\n\nPara ser tutor voluntario en Chamba, tienes dos opciones:\n\n1️⃣ Llena el formulario de registro:\n👉 forms.gle/VxgW3MHPV8A7PPg39\n\n2️⃣ Envía un WhatsApp al +503 7648-7592 escribiendo \"Tutor\" y tu nombre.\n\nTe contactaremos pronto para completar tu registro. ¡Gracias por querer ser parte de este proyecto! 💪",
                  ["Necesito tutoría", "¿Cómo funciona?"]
                );
              }}
              className="text-sm text-gray-400 hover:text-[#c41e3a] transition-colors flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              ¿Quieres ayudar? Sé tutor voluntario
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Chat Messages - Scrollable Area */
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
                    {linkifyText(msg.content)}
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
        )}
        
        {/* Footer tagline when not in chat */}
        {!hasStarted && (
          <p className="text-xs text-gray-400 text-center py-4">
            Educación gratuita para todos
          </p>
        )}
      </main>

      {/* Fixed Bottom Section - Quick Replies, Input, Footer */}
      {hasStarted && (
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
      )}

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
