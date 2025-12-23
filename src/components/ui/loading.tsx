"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-pink-200 border-t-pink-500",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-pink-600 font-medium animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-sm p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-pink-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-pink-200 rounded w-3/4" />
          <div className="h-3 bg-pink-100 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-pink-100 rounded" />
        <div className="h-3 bg-pink-100 rounded w-5/6" />
      </div>
    </div>
  );
}

