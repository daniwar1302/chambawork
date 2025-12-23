"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput, usePhoneInput } from "@/components/ui/phone-input";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneDisplay } from "@/lib/phone-utils";

function AuthPageContent() {
  const { phone, setPhone, countryCode, setCountryCode, country, isValid, fullNumber } = usePhoneInput("MX");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !isValid) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de teléfono válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el código");
      }

      toast({
        title: "¡Código enviado!",
        description: "Revisa tu teléfono para ver el código de verificación",
      });
      
      setStep("otp");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar el código",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First verify the OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber, code }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Código inválido");
      }

      // Then sign in with NextAuth
      const result = await signIn("phone-otp", {
        phone: fullNumber,
        code,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "¡Bienvenida!",
        description: "Has iniciado sesión correctamente",
      });

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al verificar el código",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-lg bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">
            {step === "phone" ? "Iniciar sesión" : "Verificar código"}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {step === "phone" 
              ? "Ingresa tu número de teléfono para recibir un código de verificación"
              : `Enviamos un código a +${country.dialCode} ${formatPhoneDisplay(phone, country)}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Número de teléfono</Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400">
                  Te enviaremos un código de 6 dígitos por SMS
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] border-gray-200 focus:border-[#c41e3a] focus:ring-[#c41e3a]/20"
                  disabled={isLoading}
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                  }}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-[#c41e3a]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cambiar número
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-[#c41e3a]"
                >
                  Reenviar código
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center pt-4 border-t border-gray-200">
            <Link href="/">
              <Button variant="ghost" className="text-gray-500 hover:text-[#c41e3a]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c41e3a]" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
