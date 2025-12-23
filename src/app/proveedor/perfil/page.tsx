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
import { 
  GraduationCap, User, BookOpen, Calendar, FileText, Check, Power, 
  Camera, X, Upload, Link as LinkIcon
} from "lucide-react";

// Subject options
const SUBJECTS = [
  { value: "MATEMATICAS", label: "Matemáticas", emoji: "➕" },
  { value: "ALGEBRA", label: "Álgebra", emoji: "📐" },
  { value: "CALCULO", label: "Cálculo", emoji: "∫" },
  { value: "FISICA", label: "Física", emoji: "⚛️" },
  { value: "QUIMICA", label: "Química", emoji: "🧪" },
  { value: "BIOLOGIA", label: "Biología", emoji: "🧬" },
  { value: "INGLES", label: "Inglés", emoji: "🗣️" },
  { value: "ESPANOL", label: "Español", emoji: "📝" },
  { value: "HISTORIA", label: "Historia", emoji: "📜" },
  { value: "GEOGRAFIA", label: "Geografía", emoji: "🌍" },
  { value: "PROGRAMACION", label: "Programación", emoji: "💻" },
  { value: "CIENCIAS_COMPUTACION", label: "Ciencias de la Computación", emoji: "🖥️" },
  { value: "ECONOMIA", label: "Economía", emoji: "📊" },
  { value: "CONTABILIDAD", label: "Contabilidad", emoji: "🧮" },
  { value: "ESTADISTICA", label: "Estadística", emoji: "📈" },
  { value: "OTRO", label: "Otra materia", emoji: "📚" },
];

// Grade level options
const GRADE_LEVELS = [
  { value: "PRIMARIA", label: "Primaria", description: "1° a 6° grado" },
  { value: "SECUNDARIA", label: "Secundaria", description: "7° a 9° grado" },
  { value: "PREPARATORIA", label: "Preparatoria", description: "10° a 12° grado" },
  { value: "UNIVERSIDAD", label: "Universidad", description: "Licenciatura" },
  { value: "POSGRADO", label: "Posgrado", description: "Maestría / Doctorado" },
  { value: "PROFESIONAL", label: "Profesional", description: "Educación continua" },
];

export default function TutorProfilePage() {
  const { update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  
  // User profile
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Tutor profile
  const [subjects, setSubjects] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [schedulingLink, setSchedulingLink] = useState("");
  const [bio, setBio] = useState("");
  const [isActive, setIsActive] = useState(true);

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

        // Load tutor profile
        const profileRes = await fetch("/api/provider/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData) {
            setHasExistingProfile(true);
            setSubjects(profileData.subjects || []);
            setGradeLevels(profileData.gradeLevels || []);
            setEducation(profileData.education || "");
            setExperience(profileData.experience || "");
            setSchedulingLink(profileData.schedulingLink || "");
            setBio(profileData.bio || "");
            setIsActive(profileData.isActive ?? true);
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

  const handleSubjectToggle = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleGradeLevelToggle = (level: string) => {
    setGradeLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
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

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || subjects.length === 0 || gradeLevels.length === 0) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa: nombre, teléfono, materias y niveles",
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

      // Update tutor profile
      const profileRes = await fetch("/api/provider/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          gradeLevels,
          education,
          experience,
          schedulingLink,
          bio,
          isActive,
        }),
      });

      if (!profileRes.ok) {
        throw new Error("Error al guardar perfil de tutor");
      }

      // Update session
      await update({ role: "TUTOR", name });

      toast({
        title: "¡Perfil guardado!",
        description: hasExistingProfile 
          ? "Tu perfil ha sido actualizado" 
          : "Ya puedes recibir solicitudes de estudiantes",
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
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c41e3a]/10 rounded-full mb-4">
          <GraduationCap className="w-4 h-4 text-[#c41e3a]" />
          <span className="text-sm text-[#c41e3a] font-medium">
            {hasExistingProfile ? "Editar perfil" : "Crear perfil de tutor"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {hasExistingProfile ? "Tu perfil de tutor" : "¡Bienvenido a Chamba Tutorías!"}
        </h1>
        <p className="text-gray-600">
          {hasExistingProfile
            ? "Actualiza tu información para atraer más estudiantes"
            : "Configura tu perfil para empezar a ayudar estudiantes"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-[#c41e3a]" />
              Foto de perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div 
                className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#c41e3a] transition-colors"
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

        {/* 2. Personal Info - Name & Phone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-[#c41e3a]" />
              1. Información personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de contacto (WhatsApp) *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+502 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Los estudiantes te contactarán por este número
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-[#c41e3a]" />
              2. Materias que puedes enseñar *
            </CardTitle>
            <CardDescription>
              Selecciona todas las materias en las que puedes dar tutoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject.value}
                  type="button"
                  onClick={() => handleSubjectToggle(subject.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    subjects.includes(subject.value)
                      ? "border-[#c41e3a] bg-[#c41e3a]/5"
                      : "border-gray-200 hover:border-[#c41e3a]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{subject.emoji}</span>
                      <span className="font-medium text-sm">{subject.label}</span>
                    </div>
                    {subjects.includes(subject.value) && (
                      <Check className="w-4 h-4 text-[#c41e3a]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {subjects.length === 0 && (
              <p className="text-sm text-red-500 mt-3">
                Selecciona al menos una materia
              </p>
            )}
          </CardContent>
        </Card>

        {/* 4. Education & Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5 text-[#c41e3a]" />
              3. Nivel de educación y experiencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education">Educación / Certificaciones</Label>
              <Input
                id="education"
                placeholder="Ej: Licenciatura en Matemáticas, USAC"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experiencia</Label>
              <Input
                id="experience"
                placeholder="Ej: 3 años dando clases particulares"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 5. Grade Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              📚 4. Niveles que puedes tutorear *
            </CardTitle>
            <CardDescription>
              ¿A qué niveles educativos puedes dar tutoría?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GRADE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleGradeLevelToggle(level.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    gradeLevels.includes(level.value)
                      ? "border-[#c41e3a] bg-[#c41e3a]/5"
                      : "border-gray-200 hover:border-[#c41e3a]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm block">{level.label}</span>
                      <span className="text-xs text-gray-500">{level.description}</span>
                    </div>
                    {gradeLevels.includes(level.value) && (
                      <Check className="w-4 h-4 text-[#c41e3a]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {gradeLevels.length === 0 && (
              <p className="text-sm text-red-500 mt-3">
                Selecciona al menos un nivel
              </p>
            )}
          </CardContent>
        </Card>

        {/* 6. Scheduling Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-[#c41e3a]" />
              5. Link para agendar sesiones
            </CardTitle>
            <CardDescription>
              Comparte tu link de Google Meet, Calendly, o cualquier herramienta para agendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="schedulingLink">Link de agenda</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="schedulingLink"
                  type="url"
                  placeholder="https://calendly.com/tu-usuario o https://meet.google.com/xxx"
                  value={schedulingLink}
                  onChange={(e) => setSchedulingLink(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Los estudiantes usarán este link para agendar sesiones contigo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 7. Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-[#c41e3a]" />
              6. Breve biografía
            </CardTitle>
            <CardDescription>
              Cuéntale a los estudiantes sobre ti y tu experiencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ej: Soy ingeniero en sistemas con 5 años de experiencia en desarrollo de software. Me apasiona enseñar programación y matemáticas de una forma práctica y divertida..."
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

        {/* Status (only for existing profiles) */}
        {hasExistingProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Power className="w-5 h-5 text-[#c41e3a]" />
                Estado de disponibilidad
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
                        ? "Recibirás nuevas solicitudes de estudiantes"
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
        <Button 
          type="submit" 
          className="w-full bg-[#c41e3a] hover:bg-[#a01830]" 
          size="lg" 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Guardando...
            </>
          ) : hasExistingProfile ? (
            "Guardar cambios"
          ) : (
            "Crear perfil y empezar a ayudar"
          )}
        </Button>
      </form>
    </div>
  );
}
