"use client";

import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isBot: boolean;
  timestamp?: Date;
}

export function ChatBubble({ message, isBot, timestamp }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isBot
            ? "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
            : "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-tr-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message}</p>
        {timestamp && (
          <p
            className={cn(
              "text-[10px] mt-1",
              isBot ? "text-gray-400" : "text-white/70"
            )}
          >
            {timestamp.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

