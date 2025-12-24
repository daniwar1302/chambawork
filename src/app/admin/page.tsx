"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, usePhoneInput } from "@/components/ui/phone-input";
import { useToast } from "@/hooks/use-toast";
import { formatFullPhoneDisplay } from "@/lib/phone-utils";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Phone, 
  User, 
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Users
} from "lucide-react";
import Link from "next/link";

// Types
type ApprovedTutor = {
  id: string;
  phone: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  usedAt: string | null;
  hasSignedUp: boolean;
  signedUpUser: {
    id: string;
    name: string | null;
    createdAt: string;
  } | null;
};

type TutorProfile = {
  id: string;
  userId: string;
  subjects: string[];
  gradeLevels: string[];
  bio: string | null;
  education: string | null;
  experience: string | null;
  schedulingLink: string | null;
  rating: number | null;
  completedSessions: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
};

// Subject options
const SUBJECTS = [
  { value: "MATEMATICAS", label: "Matemáticas" },
  { value: "ALGEBRA", label: "Álgebra" },
  { value: "CALCULO", label: "Cálculo" },
  { value: "FISICA", label: "Física" },
  { value: "QUIMICA", label: "Química" },
  { value: "BIOLOGIA", label: "Biología" },
  { value: "INGLES", label: "Inglés" },
  { value: "ESPANOL", label: "Español" },
  { value: "HISTORIA", label: "Historia" },
  { value: "GEOGRAFIA", label: "Geografía" },
  { value: "PROGRAMACION", label: "Programación" },
  { value: "CIENCIAS_COMPUTACION", label: "Ciencias de la Computación" },
  { value: "ECONOMIA", label: "Economía" },
  { value: "CONTABILIDAD", label: "Contabilidad" },
  { value: "ESTADISTICA", label: "Estadística" },
  { value: "OTRO", label: "Otro" },
];

const GRADE_LEVELS = [
  { value: "PRIMARIA", label: "Primaria" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "PREPARATORIA", label: "Preparatoria" },
  { value: "UNIVERSIDAD", label: "Universidad" },
  { value: "POSGRADO", label: "Posgrado" },
  { value: "PROFESIONAL", label: "Profesional" },
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profiles" | "whitelist">("profiles");
  
  // Tutor profiles state
  const [profiles, setProfiles] = useState<TutorProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  
  // Whitelist state
  const [tutors, setTutors] = useState<ApprovedTutor[]>([]);
  
  // New tutor profile form
  const { phone: newPhone, setPhone: setNewPhone, countryCode: newCountryCode, setCountryCode: setNewCountryCode, isValid: isNewPhoneValid, fullNumber: newFullNumber, reset: resetNewPhone } = usePhoneInput("GT");
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newEducation, setNewEducation] = useState("");
  const [newSchedulingLink, setNewSchedulingLink] = useState("");
  const [newSubjects, setNewSubjects] = useState<string[]>([]);
  const [newGradeLevels, setNewGradeLevels] = useState<string[]>(["SECUNDARIA", "PREPARATORIA"]);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Edit profile state
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editSchedulingLink, setEditSchedulingLink] = useState("");
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editGradeLevels, setEditGradeLevels] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  
  // Whitelist form - using phone input hook
  const { phone: whitelistPhone, setPhone: setWhitelistPhone, countryCode: whitelistCountryCode, setCountryCode: setWhitelistCountryCode, isValid: isWhitelistPhoneValid, fullNumber: whitelistFullNumber, reset: resetWhitelistPhone } = usePhoneInput("GT");
  const [whitelistName, setWhitelistName] = useState("");
  const [whitelistNotes, setWhitelistNotes] = useState("");
  const [isAddingWhitelist, setIsAddingWhitelist] = useState(false);
  
  // Edit whitelist state
  const { phone: editWhitelistPhone, setPhone: setEditWhitelistPhone, countryCode: editWhitelistCountryCode, setCountryCode: setEditWhitelistCountryCode, isValid: isEditWhitelistPhoneValid, fullNumber: editWhitelistFullNumber } = usePhoneInput("GT");
  const [editingWhitelistId, setEditingWhitelistId] = useState<string | null>(null);
  const [editWhitelistName, setEditWhitelistName] = useState("");
  const [editWhitelistNotes, setEditWhitelistNotes] = useState("");
  
  const { toast } = useToast();

  // Fetch tutor profiles
  const fetchProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await fetch("/api/admin/tutor-profiles", {
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Error fetching profiles");
      }
      
      const data = await res.json();
      setProfiles(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [adminKey, toast]);

  // Fetch whitelist
  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tutors", {
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Error fetching tutors");
      }
      
      const data = await res.json();
      setTutors(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tutores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, toast]);

  const handleAuthenticate = async () => {
    if (!adminKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa la clave de admin",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tutor-profiles", {
        headers: { "x-admin-key": adminKey },
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        setProfiles(data);
        toast({
          title: "Autenticado",
          description: "Acceso de admin concedido",
        });
      } else {
        toast({
          title: "Error",
          description: "Clave de admin inválida",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new tutor profile
  const handleAddProfile = async () => {
    if (!newName.trim() || !isNewPhoneValid || newSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Nombre, teléfono y al menos una materia son requeridos",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingProfile(true);
    try {
      const res = await fetch("/api/admin/tutor-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          name: newName,
          phone: newFullNumber,
          subjects: newSubjects,
          gradeLevels: newGradeLevels,
          bio: newBio || null,
          education: newEducation || null,
          schedulingLink: newSchedulingLink || null,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error adding profile");
      }
      
      toast({
        title: "Tutor agregado",
        description: `${newName} ahora aparece en el chatbot`,
      });
      
      // Reset form
      resetNewPhone();
      setNewName("");
      setNewBio("");
      setNewEducation("");
      setNewSchedulingLink("");
      setNewSubjects([]);
      setNewGradeLevels(["SECUNDARIA", "PREPARATORIA"]);
      setShowAddForm(false);
      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar",
        variant: "destructive",
      });
    } finally {
      setIsAddingProfile(false);
    }
  };

  // Update tutor profile
  const handleUpdateProfile = async (id: string) => {
    try {
      const res = await fetch("/api/admin/tutor-profiles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id,
          name: editName,
          subjects: editSubjects,
          gradeLevels: editGradeLevels,
          bio: editBio,
          education: editEducation,
          schedulingLink: editSchedulingLink,
          isActive: editIsActive,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Error updating profile");
      }
      
      toast({
        title: "Actualizado",
        description: "Perfil actualizado correctamente",
      });
      
      setEditingProfileId(null);
      fetchProfiles();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  // Delete tutor profile
  const handleDeleteProfile = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}? Ya no aparecerá en el chatbot.`)) return;
    
    try {
      const res = await fetch(`/api/admin/tutor-profiles?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        throw new Error("Error deleting profile");
      }
      
      toast({
        title: "Eliminado",
        description: `${name} ha sido eliminado`,
      });
      
      fetchProfiles();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  // Toggle active status
  const handleToggleActive = async (profile: TutorProfile) => {
    try {
      const res = await fetch("/api/admin/tutor-profiles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id: profile.id,
          isActive: !profile.isActive,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Error updating status");
      }
      
      toast({
        title: profile.isActive ? "Desactivado" : "Activado",
        description: `${profile.user.name} ${profile.isActive ? "ya no" : "ahora"} aparece en búsquedas`,
      });
      
      fetchProfiles();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  const startEditProfile = (profile: TutorProfile) => {
    setEditingProfileId(profile.id);
    setEditName(profile.user.name || "");
    setEditBio(profile.bio || "");
    setEditEducation(profile.education || "");
    setEditSchedulingLink(profile.schedulingLink || "");
    setEditSubjects(profile.subjects);
    setEditGradeLevels(profile.gradeLevels);
    setEditIsActive(profile.isActive);
  };

  // Whitelist functions
  const handleAddWhitelist = async () => {
    if (!whitelistPhone.trim() || !isWhitelistPhoneValid) {
      toast({
        title: "Error",
        description: "Ingresa un número de teléfono válido",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingWhitelist(true);
    try {
      const res = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          phone: whitelistFullNumber,
          name: whitelistName || null,
          notes: whitelistNotes || null,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error adding tutor");
      }
      
      toast({
        title: "Agregado",
        description: `+${whitelistFullNumber} ha sido agregado a la lista`,
      });
      
      resetWhitelistPhone();
      setWhitelistName("");
      setWhitelistNotes("");
      fetchTutors();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar",
        variant: "destructive",
      });
    } finally {
      setIsAddingWhitelist(false);
    }
  };

  const handleUpdateWhitelist = async (id: string) => {
    if (!isEditWhitelistPhoneValid) {
      toast({
        title: "Error",
        description: "Ingresa un número de teléfono válido",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const res = await fetch("/api/admin/tutors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id,
          phone: editWhitelistFullNumber,
          name: editWhitelistName,
          notes: editWhitelistNotes,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Error updating");
      }
      
      toast({
        title: "Actualizado",
        description: "Tutor actualizado correctamente",
      });
      
      setEditingWhitelistId(null);
      fetchTutors();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWhitelist = async (id: string, phone: string) => {
    if (!confirm(`¿Estás seguro de eliminar ${phone}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/tutors?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        throw new Error("Error deleting");
      }
      
      toast({
        title: "Eliminado",
        description: `${phone} ha sido eliminado de la lista`,
      });
      
      fetchTutors();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfiles();
      fetchTutors();
    }
  }, [isAuthenticated, fetchProfiles, fetchTutors]);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-[#c41e3a] rounded-full flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-500 text-sm">
              Gestiona tutores y perfiles
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key" className="text-gray-700 text-sm">
                Clave de Admin
              </Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="••••••••••••"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#c41e3a] focus:ring-[#c41e3a]"
              />
            </div>
            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="w-full py-3 bg-[#c41e3a] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#a01830] transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </button>
            
            <Link 
              href="/" 
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#c41e3a] transition-colors pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-10 h-10 bg-[#c41e3a] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 text-sm">
                Gestiona tutores del chatbot
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setAdminKey("");
            }}
            className="text-sm text-gray-500 hover:text-[#c41e3a] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "profiles" 
                ? "bg-[#c41e3a] text-white" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Perfiles de Tutores ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "whitelist" 
                ? "bg-[#c41e3a] text-white" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            Whitelist ({tutors.length})
          </button>
        </div>

        {/* Tutor Profiles Tab */}
        {activeTab === "profiles" && (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>💡 Estos tutores aparecen directamente en el chatbot.</strong> Cuando agregas, editas o eliminas un tutor aquí, los cambios se reflejan inmediatamente en las búsquedas del chatbot.
            </div>

            {/* Add new profile button/form */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#c41e3a] hover:text-[#c41e3a] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar Nuevo Tutor
              </button>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-[#c41e3a]" />
                    <h2 className="text-lg font-semibold text-gray-900">Agregar Nuevo Tutor</h2>
                  </div>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <User className="w-3 h-3" /> Nombre *
                    </Label>
                    <Input
                      type="text"
                      placeholder="María García"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Teléfono *
                    </Label>
                    <PhoneInput
                      id="new-profile-phone"
                      value={newPhone}
                      onChange={setNewPhone}
                      countryCode={newCountryCode}
                      onCountryChange={setNewCountryCode}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Materias *
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((subject) => (
                        <button
                          key={subject.value}
                          type="button"
                          onClick={() => {
                            setNewSubjects(prev => 
                              prev.includes(subject.value)
                                ? prev.filter(s => s !== subject.value)
                                : [...prev, subject.value]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            newSubjects.includes(subject.value)
                              ? "bg-[#c41e3a] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {subject.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-600 text-xs">Niveles Académicos</Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => {
                            setNewGradeLevels(prev => 
                              prev.includes(level.value)
                                ? prev.filter(l => l !== level.value)
                                : [...prev, level.value]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            newGradeLevels.includes(level.value)
                              ? "bg-[#c41e3a] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Educación
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ej: Ing. en Matemáticas"
                      value={newEducation}
                      onChange={(e) => setNewEducation(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Link de Agendamiento
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://calendly.com/tutor"
                      value={newSchedulingLink}
                      onChange={(e) => setNewSchedulingLink(e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-600 text-xs flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Biografía
                    </Label>
                    <textarea
                      placeholder="Breve descripción del tutor..."
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm resize-none focus:border-[#c41e3a] focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddProfile}
                    disabled={isAddingProfile || !newName.trim() || !isNewPhoneValid || newSubjects.length === 0}
                    className="px-6 py-2 bg-[#c41e3a] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#a01830] transition-all flex items-center gap-2"
                  >
                    {isAddingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Agregar Tutor
                  </button>
                </div>
              </div>
            )}

            {/* Profiles list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tutores Activos en Chatbot
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Estos tutores aparecen cuando los estudiantes buscan ayuda
                </p>
              </div>
              
              <div className="p-6">
                {isLoadingProfiles ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c41e3a]" />
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No hay tutores. Agrega uno para que aparezca en el chatbot.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`p-4 rounded-lg border ${
                          profile.isActive 
                            ? "bg-white border-gray-200" 
                            : "bg-gray-50 border-gray-200 opacity-60"
                        }`}
                      >
                        {editingProfileId === profile.id ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nombre"
                                className="bg-white border-gray-300"
                              />
                              <Input
                                value={editSchedulingLink}
                                onChange={(e) => setEditSchedulingLink(e.target.value)}
                                placeholder="Link de agendamiento"
                                className="bg-white border-gray-300"
                              />
                              <Input
                                value={editEducation}
                                onChange={(e) => setEditEducation(e.target.value)}
                                placeholder="Educación"
                                className="bg-white border-gray-300"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditIsActive(!editIsActive)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                    editIsActive 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {editIsActive ? (
                                    <ToggleRight className="w-4 h-4" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4" />
                                  )}
                                  {editIsActive ? "Activo" : "Inactivo"}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-500">Materias</Label>
                              <div className="flex flex-wrap gap-1">
                                {SUBJECTS.map((subject) => (
                                  <button
                                    key={subject.value}
                                    type="button"
                                    onClick={() => {
                                      setEditSubjects(prev => 
                                        prev.includes(subject.value)
                                          ? prev.filter(s => s !== subject.value)
                                          : [...prev, subject.value]
                                      );
                                    }}
                                    className={`px-2 py-1 rounded-full text-xs transition-all ${
                                      editSubjects.includes(subject.value)
                                        ? "bg-[#c41e3a] text-white"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {subject.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              value={editBio}
                              onChange={(e) => setEditBio(e.target.value)}
                              placeholder="Biografía"
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingProfileId(null)}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleUpdateProfile(profile.id)}
                                className="px-4 py-1.5 bg-[#c41e3a] text-white rounded-lg text-sm"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">
                                  {profile.user.name}
                                </span>
                                {profile.isActive ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {profile.subjects.map((subject) => (
                                  <span
                                    key={subject}
                                    className="px-2 py-0.5 text-xs bg-[#c41e3a]/10 text-[#c41e3a] rounded-full"
                                  >
                                    {SUBJECTS.find(s => s.value === subject)?.label || subject}
                                  </span>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                {profile.user.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {formatFullPhoneDisplay(profile.user.phone)}
                                  </div>
                                )}
                                {profile.schedulingLink && (
                                  <div className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    <a href={profile.schedulingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">
                                      {profile.schedulingLink}
                                    </a>
                                  </div>
                                )}
                                {profile.bio && (
                                  <p className="text-gray-500 mt-1 line-clamp-2">{profile.bio}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleActive(profile)}
                                className={`p-2 rounded-lg transition-colors ${
                                  profile.isActive
                                    ? "text-green-600 hover:bg-green-50"
                                    : "text-gray-400 hover:bg-gray-100"
                                }`}
                                title={profile.isActive ? "Desactivar" : "Activar"}
                              >
                                {profile.isActive ? (
                                  <ToggleRight className="w-5 h-5" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => startEditProfile(profile)}
                                className="p-2 text-gray-400 hover:text-[#c41e3a] transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProfile(profile.id, profile.user.name || "tutor")}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Whitelist Tab */}
        {activeTab === "whitelist" && (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>📋 Whitelist (lista de espera):</strong> Estos números pueden registrarse como tutores en la app. Pero NO aparecen en el chatbot hasta que tengan un perfil completo.
            </div>

            {/* Add to whitelist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-5 h-5 text-[#c41e3a]" />
                <h2 className="text-lg font-semibold text-gray-900">Agregar a Whitelist</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Teléfono *
                  </Label>
                  <PhoneInput
                    id="whitelist-phone"
                    value={whitelistPhone}
                    onChange={setWhitelistPhone}
                    countryCode={whitelistCountryCode}
                    onCountryChange={setWhitelistCountryCode}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Nombre
                  </Label>
                  <Input
                    type="text"
                    placeholder="Juan Pérez"
                    value={whitelistName}
                    onChange={(e) => setWhitelistName(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Notas
                  </Label>
                  <Input
                    type="text"
                    placeholder="Verificación completada"
                    value={whitelistNotes}
                    onChange={(e) => setWhitelistNotes(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddWhitelist}
                    disabled={isAddingWhitelist || !isWhitelistPhoneValid}
                    className="w-full py-2.5 bg-[#c41e3a] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#a01830] transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {isAddingWhitelist ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Whitelist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lista de Espera
                </h2>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c41e3a]" />
                  </div>
                ) : tutors.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No hay tutores en la whitelist
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tutors.map((tutor) => (
                      <div
                        key={tutor.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {editingWhitelistId === tutor.id ? (
                          <div className="flex-1 grid gap-3 md:grid-cols-4">
                            <PhoneInput
                              value={editWhitelistPhone}
                              onChange={setEditWhitelistPhone}
                              countryCode={editWhitelistCountryCode}
                              onCountryChange={setEditWhitelistCountryCode}
                            />
                            <Input
                              value={editWhitelistName}
                              onChange={(e) => setEditWhitelistName(e.target.value)}
                              placeholder="Nombre"
                              className="bg-white border-gray-300"
                            />
                            <Input
                              value={editWhitelistNotes}
                              onChange={(e) => setEditWhitelistNotes(e.target.value)}
                              placeholder="Notas"
                              className="bg-white border-gray-300"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateWhitelist(tutor.id)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => setEditingWhitelistId(null)}
                                className="flex-1 py-2 bg-gray-400 hover:bg-gray-500 rounded-lg transition-colors flex items-center justify-center"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-gray-900">
                                  {formatFullPhoneDisplay(tutor.phone)}
                                </span>
                                {tutor.hasSignedUp ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full border border-green-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Registrado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                                    <Clock className="w-3 h-3" />
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                {tutor.name && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {tutor.name}
                                  </span>
                                )}
                                {tutor.notes && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {tutor.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingWhitelistId(tutor.id);
                                  setEditWhitelistPhone(tutor.phone);
                                  setEditWhitelistName(tutor.name || "");
                                  setEditWhitelistNotes(tutor.notes || "");
                                }}
                                className="p-2 text-gray-400 hover:text-[#c41e3a] transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWhitelist(tutor.id, tutor.phone)}
                                className="p-2 text-gray-400 hover:text-[#c41e3a] transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
