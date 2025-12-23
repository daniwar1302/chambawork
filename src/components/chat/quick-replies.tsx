"use client";

import { Button } from "@/components/ui/button";

interface QuickRepliesProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 text-xs"
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

