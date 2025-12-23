"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { AlertCircle, ArrowLeft } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Error de configuración",
      description: "Hay un problema con la configuración del servidor. Por favor, contacta al soporte.",
    },
    AccessDenied: {
      title: "Acceso denegado",
      description: "No tienes permiso para acceder a esta página.",
    },
    Verification: {
      title: "Enlace expirado",
      description: "El enlace de verificación ha expirado o ya fue usado. Por favor, solicita uno nuevo.",
    },
    Default: {
      title: "Error de autenticación",
      description: "Ocurrió un error al intentar iniciar sesión. Por favor, intenta de nuevo.",
    },
  };

  const { title, description } = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <Card className="backdrop-blur-sm text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <CardTitle className="text-2xl text-gray-800">
          {title}
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link href="/auth">
          <Button className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a iniciar sesión
          </Button>
        </Link>

        <Link href="/">
          <Button variant="ghost" className="w-full">
            Ir al inicio
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
