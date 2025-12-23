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
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

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

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tutors, setTutors] = useState<ApprovedTutor[]>([]);
  
  // New tutor form - using phone input hook
  const { phone: newPhone, setPhone: setNewPhone, countryCode: newCountryCode, setCountryCode: setNewCountryCode, isValid: isNewPhoneValid, fullNumber: newFullNumber, reset: resetNewPhone } = usePhoneInput("MX");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Edit state - using phone input hook
  const { phone: editPhone, setPhone: setEditPhone, countryCode: editCountryCode, setCountryCode: setEditCountryCode, isValid: isEditPhoneValid, fullNumber: editFullNumber } = usePhoneInput("MX");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  
  const { toast } = useToast();

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tutors", {
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          toast({
            title: "Sesión expirada",
            description: "Por favor ingresa la clave de admin nuevamente",
            variant: "destructive",
          });
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
      const res = await fetch("/api/admin/tutors", {
        headers: { "x-admin-key": adminKey },
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        setTutors(data);
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

  const handleAddTutor = async () => {
    if (!newPhone.trim() || !isNewPhoneValid) {
      toast({
        title: "Error",
        description: "Ingresa un número de teléfono válido",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          phone: newFullNumber,
          name: newName || null,
          notes: newNotes || null,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error adding tutor");
      }
      
      toast({
        title: "Tutor agregado",
        description: `+${newFullNumber} ha sido agregado a la lista`,
      });
      
      resetNewPhone();
      setNewName("");
      setNewNotes("");
      fetchTutors();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateTutor = async (id: string) => {
    if (!isEditPhoneValid) {
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
          phone: editFullNumber,
          name: editName,
          notes: editNotes,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Error updating tutor");
      }
      
      toast({
        title: "Actualizado",
        description: "Tutor actualizado correctamente",
      });
      
      setEditingId(null);
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

  const handleDeleteTutor = async (id: string, phone: string) => {
    if (!confirm(`¿Estás seguro de eliminar ${phone}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/tutors?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      
      if (!res.ok) {
        throw new Error("Error deleting tutor");
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

  const startEdit = (tutor: ApprovedTutor) => {
    setEditingId(tutor.id);
    setEditPhone(tutor.phone);
    setEditName(tutor.name || "");
    setEditNotes(tutor.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPhone("");
    setEditName("");
    setEditNotes("");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTutors();
    }
  }, [isAuthenticated, fetchTutors]);

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
              Gestiona tutores aprobados
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
      <div className="max-w-5xl mx-auto space-y-8">
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
              <h1 className="text-xl font-bold text-gray-900">Tutores Aprobados</h1>
              <p className="text-gray-500 text-sm">
                Gestiona quién puede registrarse como tutor
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

        {/* Add new tutor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Plus className="w-5 h-5 text-[#c41e3a]" />
            <h2 className="text-lg font-semibold text-gray-900">Agregar Tutor</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-gray-600 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono *
              </Label>
              <PhoneInput
                id="new-phone"
                value={newPhone}
                onChange={setNewPhone}
                countryCode={newCountryCode}
                onCountryChange={setNewCountryCode}
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
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#c41e3a]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 text-xs flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Notas
              </Label>
              <Input
                type="text"
                placeholder="Ej: Certificado en Matemáticas, Especialización en Física..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#c41e3a]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddTutor}
                disabled={isAdding || !isNewPhoneValid}
                className="w-full py-2.5 bg-[#c41e3a] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#a01830] transition-all text-sm flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Tutor list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Tutores 
              <span className="text-gray-400 font-normal ml-2">({tutors.length})</span>
            </h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#c41e3a]" />
              </div>
            ) : tutors.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No hay tutores aprobados aún
              </div>
            ) : (
              <div className="space-y-2">
                {tutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editingId === tutor.id ? (
                      // Edit mode
                      <div className="flex-1 grid gap-3 md:grid-cols-4">
                        <PhoneInput
                          value={editPhone}
                          onChange={setEditPhone}
                          countryCode={editCountryCode}
                          onCountryChange={setEditCountryCode}
                        />
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nombre"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                        <Input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notas"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTutor(tutor.id)}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 py-2 bg-gray-400 hover:bg-gray-500 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
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
                            onClick={() => startEdit(tutor)}
                            className="p-2 text-gray-400 hover:text-[#c41e3a] transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTutor(tutor.id, tutor.phone)}
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

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">¿Cómo funciona?</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-500">
            <li>Verifica los antecedentes del tutor voluntario</li>
            <li>Agrega su número de teléfono aquí</li>
            <li>El tutor se registra con ese número en la app</li>
            <li>Ahora puede cambiar su rol a TUTOR</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
