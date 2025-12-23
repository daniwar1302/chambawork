"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { 
  Sparkles, User, MapPin, DollarSign, FileText, Check, Power, 
  Camera, X, Upload, Navigation, Plus, Image as ImageIcon 
} from "lucide-react";

export default function ProveedorPerfilPage() {
  const { update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  
  // User profile
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Provider profile
  const [city, setCity] = useState("");
  const [serviceAreaRadiusKm, setServiceAreaRadiusKm] = useState(10);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState(0);
  const [priceTo, setPriceTo] = useState<number | null>(null);
  const [bio, setBio] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [salonName, setSalonName] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  
  // Location
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // New specialty input
  const [newSpecialty, setNewSpecialty] = useState("");

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Load user data
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          setName(userData.name || "");
          setPhone(userData.phone || "");
          setProfilePhoto(userData.profilePhoto || userData.image || null);
        }

        // Load provider profile
        const profileRes = await fetch("/api/provider/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData) {
            setHasExistingProfile(true);
            setCity(profileData.city || "");
            setServiceAreaRadiusKm(profileData.serviceAreaRadiusKm || 10);
            setServicesOffered(profileData.servicesOffered || []);
            setPriceFrom(profileData.priceFrom || 0);
            setPriceTo(profileData.priceTo || null);
            setBio(profileData.bio || "");
            setIsActive(profileData.isActive ?? true);
            setSpecialties(profileData.specialties || []);
            setPortfolioPhotos(profileData.portfolioPhotos || []);
            setSalonName(profileData.salonName || "");
            setSalonAddress(profileData.salonAddress || "");
            setLat(profileData.lat || null);
            setLng(profileData.lng || null);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleServiceToggle = (service: string) => {
    setServicesOffered((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsGettingLocation(false);
        toast({
          title: "Ubicación obtenida",
          description: "Tu ubicación ha sido guardada correctamente",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "No se pudo obtener tu ubicación";
        if (error.code === 1) {
          errorMessage = "Permiso de ubicación denegado. Por favor habilita el acceso a tu ubicación.";
        } else if (error.code === 2) {
          errorMessage = "No se pudo determinar tu ubicación. Intenta de nuevo.";
        } else if (error.code === 3) {
          errorMessage = "Tiempo de espera agotado. Intenta de nuevo.";
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for now (in production, upload to cloud storage)
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    
    for (let i = 0; i < Math.min(files.length, 10 - portfolioPhotos.length); i++) {
      const file = files[i];
      
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newPhotos.push(event.target?.result as string);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setPortfolioPhotos([...portfolioPhotos, ...newPhotos]);
  };

  const removePortfolioPhoto = (index: number) => {
    setPortfolioPhotos(portfolioPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !city || servicesOffered.length === 0 || priceFrom <= 0) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update user name, phone, and photo
      const userRes = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, profilePhoto }),
      });

      if (!userRes.ok) {
        throw new Error("Error al actualizar perfil de usuario");
      }

      // Update provider profile
      const profileRes = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          serviceAreaRadiusKm,
          servicesOffered,
          priceFrom,
          priceTo,
          bio,
          isActive,
          specialties,
          portfolioPhotos,
          salonName,
          salonAddress,
          lat,
          lng,
        }),
      });

      if (!profileRes.ok) {
        throw new Error("Error al guardar perfil de proveedora");
      }

      // Update session
      await update({ role: "TUTOR", name });

      toast({
        title: "¡Perfil guardado!",
        description: hasExistingProfile 
          ? "Tu perfil ha sido actualizado" 
          : "Ya puedes recibir solicitudes",
        variant: "success",
      });

      if (!hasExistingProfile) {
        router.push("/proveedor/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el perfil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-700 font-medium">
            {hasExistingProfile ? "Editar perfil" : "Crear perfil de proveedora"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {hasExistingProfile ? "Tu perfil" : "¡Bienvenida a Chamba!"}
        </h1>
        <p className="text-gray-600">
          {hasExistingProfile
            ? "Actualiza tu información para atraer más clientas"
            : "Configura tu perfil para empezar a recibir solicitudes"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-purple-500" />
              Foto de perfil
            </CardTitle>
            <CardDescription>
              Una buena foto ayuda a generar confianza con las clientas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div 
                className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePhoto ? (
                  <>
                    <img 
                      src={profilePhoto} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {profilePhoto ? "Cambiar foto" : "Subir foto"}
                </Button>
                {profilePhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-2 text-red-500"
                    onClick={() => setProfilePhoto(null)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG o GIF. Máximo 5MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-purple-500" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Número de teléfono"
                />
                <p className="text-xs text-gray-500">
                  Las clientas te contactarán por este número
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-purple-500" />
              Ubicación y área de servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  placeholder="Ej: Ciudad de México"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Radio de servicio (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  min={1}
                  max={100}
                  value={serviceAreaRadiusKm}
                  onChange={(e) => setServiceAreaRadiusKm(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  Distancia máxima que estás dispuesta a desplazarte
                </p>
              </div>
            </div>

            {/* GPS Location */}
            <div className="space-y-2">
              <Label>Ubicación GPS (opcional)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      {lat && lng ? "Actualizar ubicación" : "Obtener mi ubicación"}
                    </>
                  )}
                </Button>
                {lat && lng && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Ubicación guardada
                  </span>
                )}
              </div>
              {locationError && (
                <p className="text-sm text-red-500">{locationError}</p>
              )}
              <p className="text-xs text-gray-500">
                Tu ubicación ayuda a las clientas a encontrar servicios cercanos
              </p>
            </div>

            {/* Salon Info (optional) */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                ¿Tienes salón? (opcional)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salonName" className="text-sm text-gray-600">Nombre del salón</Label>
                  <Input
                    id="salonName"
                    placeholder="Mi Salón de Uñas"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salonAddress" className="text-sm text-gray-600">Dirección del salón</Label>
                  <Input
                    id="salonAddress"
                    placeholder="Calle, número, colonia..."
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💅 Servicios que ofreces
            </CardTitle>
            <CardDescription>
              Selecciona los servicios que realizas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleServiceToggle("MANICURA")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  servicesOffered.includes("MANICURA")
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl mb-2 block">💅</span>
                    <span className="font-medium">Manicura</span>
                  </div>
                  {servicesOffered.includes("MANICURA") && (
                    <Check className="w-5 h-5 text-pink-500" />
                  )}
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleServiceToggle("PEDICURA")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  servicesOffered.includes("PEDICURA")
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl mb-2 block">🦶</span>
                    <span className="font-medium">Pedicura</span>
                  </div>
                  {servicesOffered.includes("PEDICURA") && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </div>
              </button>
            </div>
            {servicesOffered.length === 0 && (
              <p className="text-sm text-red-500">
                Selecciona al menos un servicio
              </p>
            )}

            {/* Specialties */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Especialidades (opcional)
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Gel ruso, Nail art, Acrílico..."
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSpecialty())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSpecialty}
                  disabled={!newSpecialty.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-purple-500" />
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceFrom">Precio desde (MXN) *</Label>
                <Input
                  id="priceFrom"
                  type="number"
                  min={0}
                  placeholder="150"
                  value={priceFrom || ""}
                  onChange={(e) => setPriceFrom(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceTo">Precio hasta (MXN)</Label>
                <Input
                  id="priceTo"
                  type="number"
                  min={priceFrom || 0}
                  placeholder="500"
                  value={priceTo || ""}
                  onChange={(e) => setPriceTo(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Las clientas verán este rango de precios como referencia
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              Portafolio de trabajos
            </CardTitle>
            <CardDescription>
              Muestra tus mejores trabajos para atraer clientas (máx. 10 fotos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {portfolioPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img 
                    src={photo} 
                    alt={`Trabajo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolioPhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {portfolioPhotos.length < 10 && (
                <button
                  type="button"
                  onClick={() => portfolioInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-purple-500"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs mt-1">Agregar</span>
                </button>
              )}
            </div>
            <input
              ref={portfolioInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePortfolioUpload}
            />
            <p className="text-xs text-gray-500 mt-3">
              {portfolioPhotos.length}/10 fotos. JPG, PNG o GIF. Máximo 5MB cada una.
            </p>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-purple-500" />
              Sobre ti
            </CardTitle>
            <CardDescription>
              Cuéntale a las clientas por qué elegirte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ej: Especialista en uñas con 5 años de experiencia. Trabajo con productos de alta calidad y ofrezco atención personalizada..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              {bio.length}/500 caracteres
            </p>
          </CardContent>
        </Card>

        {/* Status */}
        {hasExistingProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Power className="w-5 h-5 text-purple-500" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {isActive ? "Disponible" : "No disponible"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isActive
                        ? "Recibirás nuevas solicitudes"
                        : "No recibirás nuevas solicitudes"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isActive ? "outline" : "default"}
                  onClick={() => setIsActive(!isActive)}
                >
                  {isActive ? "Pausar" : "Activar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Guardando...
            </>
          ) : hasExistingProfile ? (
            "Guardar cambios"
          ) : (
            "Crear perfil y empezar"
          )}
        </Button>
      </form>
    </div>
  );
}
