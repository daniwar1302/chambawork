"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  Paintbrush,
  Navigation,
  ChevronRight
} from "lucide-react";

type ServiceType = "MANICURA" | "PEDICURA";
type Modality = "A_DOMICILIO" | "EN_SALON";

interface Preferences {
  preferWoman: boolean;
  gel: boolean;
  ruso: boolean;
  nailArt: boolean;
  noPreference: boolean;
  notes: string;
}

export default function NuevaSolicitudPage() {
  useSession(); // Required for auth check
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Form state
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [modality, setModality] = useState<Modality | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    preferWoman: false,
    gel: false,
    ruso: false,
    nailArt: false,
    noPreference: true,
    notes: "",
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "No disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsGettingLocation(false);
        toast({
          title: "¡Ubicación obtenida!",
          description: "Usaremos tu ubicación para encontrar proveedoras cercanas",
          variant: "success",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Geolocation error:", error);
        toast({
          title: "No pudimos obtener tu ubicación",
          description: "Puedes continuar ingresando tu dirección manualmente",
        });
      }
    );
  };

  const handlePreferenceChange = (key: keyof Preferences, value: boolean) => {
    if (key === "noPreference" && value) {
      // If "no preference" is selected, uncheck others
      setPreferences({
        preferWoman: false,
        gel: false,
        ruso: false,
        nailArt: false,
        noPreference: true,
        notes: preferences.notes,
      });
    } else if (key !== "notes") {
      // If any other preference is selected, uncheck "no preference"
      setPreferences({
        ...preferences,
        [key]: value,
        noPreference: false,
      });
    }
  };

  const handleSubmit = async () => {
    if (!serviceType || !modality || !date || !time || !locationText) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const dateTime = new Date(`${date}T${time}`);
      
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          modality,
          dateTime: dateTime.toISOString(),
          locationText,
          lat,
          lng,
          preferences,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear solicitud");
      }

      const job = await response.json();
      router.push(`/cliente/solicitud/${job.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500"
                : s < step
                ? "w-8 bg-pink-300"
                : "w-8 bg-pink-100"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Service Type */}
      {step === 1 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              ¿Qué servicio necesitas?
            </CardTitle>
            <CardDescription>
              Elige el tipo de servicio que te gustaría
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setServiceType("MANICURA")}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center hover:shadow-lg ${
                  serviceType === "MANICURA"
                    ? "border-pink-500 bg-pink-50 shadow-lg shadow-pink-200/50"
                    : "border-pink-100 hover:border-pink-300"
                }`}
              >
                <span className="text-5xl mb-3 block">💅</span>
                <span className="font-semibold text-gray-800">Manicura</span>
              </button>
              
              <button
                onClick={() => setServiceType("PEDICURA")}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center hover:shadow-lg ${
                  serviceType === "PEDICURA"
                    ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-200/50"
                    : "border-pink-100 hover:border-purple-300"
                }`}
              >
                <span className="text-5xl mb-3 block">🦶</span>
                <span className="font-semibold text-gray-800">Pedicura</span>
              </button>
            </div>

            <div className="pt-4">
              <Button
                className="w-full"
                disabled={!serviceType}
                onClick={() => setStep(2)}
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date, Time, Location */}
      {step === 2 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5 text-pink-500" />
              ¿Cuándo y dónde?
            </CardTitle>
            <CardDescription>
              Elige la fecha, hora y ubicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Modality */}
            <div className="space-y-3">
              <Label>Modalidad</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModality("A_DOMICILIO")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    modality === "A_DOMICILIO"
                      ? "border-pink-500 bg-pink-50"
                      : "border-pink-100 hover:border-pink-300"
                  }`}
                >
                  <span className="text-2xl mb-2 block">🏠</span>
                  <span className="font-medium text-sm">A domicilio</span>
                  <p className="text-xs text-gray-500 mt-1">La proveedora va a ti</p>
                </button>
                
                <button
                  onClick={() => setModality("EN_SALON")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    modality === "EN_SALON"
                      ? "border-pink-500 bg-pink-50"
                      : "border-pink-100 hover:border-pink-300"
                  }`}
                >
                  <span className="text-2xl mb-2 block">💇‍♀️</span>
                  <span className="font-medium text-sm">En salón</span>
                  <p className="text-xs text-gray-500 mt-1">Tú vas al salón</p>
                </button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Hora
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-2" />
                {modality === "A_DOMICILIO" ? "Tu dirección" : "Zona o colonia"}
              </Label>
              <Input
                id="location"
                placeholder={
                  modality === "A_DOMICILIO"
                    ? "Ej: Calle Reforma 123, Col. Centro"
                    : "Ej: Zona Rosa, CDMX"
                }
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="mt-2"
              >
                {isGettingLocation ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Obteniendo ubicación...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    {lat && lng ? "✓ Ubicación guardada" : "Compartir mi ubicación"}
                  </>
                )}
              </Button>
              {lat && lng && (
                <p className="text-xs text-green-600 mt-1">
                  📍 Coordenadas guardadas para mejor precisión
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atrás
              </Button>
              <Button
                className="flex-1"
                disabled={!modality || !date || !time || !locationText}
                onClick={() => setStep(3)}
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Paintbrush className="w-5 h-5 text-pink-500" />
              Preferencias (opcional)
            </CardTitle>
            <CardDescription>
              Cuéntanos qué buscas para encontrar la proveedora ideal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preferences checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="noPreference"
                  checked={preferences.noPreference}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("noPreference", checked as boolean)
                  }
                />
                <Label htmlFor="noPreference" className="cursor-pointer">
                  Sin preferencia específica
                </Label>
              </div>

              <div className="h-px bg-pink-100" />

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="preferWoman"
                  checked={preferences.preferWoman}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("preferWoman", checked as boolean)
                  }
                />
                <Label htmlFor="preferWoman" className="cursor-pointer">
                  Preferiblemente mujer
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="gel"
                  checked={preferences.gel}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("gel", checked as boolean)
                  }
                />
                <Label htmlFor="gel" className="cursor-pointer">
                  Gel / Semipermanente
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="ruso"
                  checked={preferences.ruso}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("ruso", checked as boolean)
                  }
                />
                <Label htmlFor="ruso" className="cursor-pointer">
                  Manicura rusa
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="nailArt"
                  checked={preferences.nailArt}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("nailArt", checked as boolean)
                  }
                />
                <Label htmlFor="nailArt" className="cursor-pointer">
                  Nail art / Decoración
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Tengo alergia al acetato, prefiero productos veganos..."
                value={preferences.notes}
                onChange={(e) =>
                  setPreferences({ ...preferences, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-pink-50 rounded-2xl space-y-2">
              <h4 className="font-semibold text-pink-800">Resumen de tu cita</h4>
              <div className="text-sm text-pink-700 space-y-1">
                <p>
                  <span className="font-medium">Servicio:</span>{" "}
                  {serviceType === "MANICURA" ? "💅 Manicura" : "🦶 Pedicura"}
                </p>
                <p>
                  <span className="font-medium">Modalidad:</span>{" "}
                  {modality === "A_DOMICILIO" ? "🏠 A domicilio" : "💇‍♀️ En salón"}
                </p>
                <p>
                  <span className="font-medium">Fecha:</span>{" "}
                  {new Date(`${date}T${time}`).toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <span className="font-medium">Ubicación:</span> {locationText}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atrás
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    Ver proveedoras
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

