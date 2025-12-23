"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { 
  getServiceLabel, 
  getModalityLabel, 
  getStatusLabel,
  formatDateTime 
} from "@/lib/utils";
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  RefreshCw,
  Check,
  Phone,
  Star,
  DollarSign,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Provider {
  id: string;
  name: string | null;
  phone: string | null;
  profile: {
    city: string;
    priceFrom: number;
    bio: string | null;
    rating: number | null;
    servicesOffered: string[];
  } | null;
  distance: number | null;
}

interface JobOffer {
  id: string;
  status: string;
  provider: {
    id: string;
    name: string | null;
    phone: string | null;
    providerProfile: {
      city: string;
      priceFrom: number;
      bio: string | null;
    } | null;
  };
}

interface JobRequest {
  id: string;
  serviceType: string;
  dateTime: string;
  locationText: string;
  modality: string;
  status: string;
  preferences: {
    preferWoman?: boolean;
    gel?: boolean;
    ruso?: boolean;
    nailArt?: boolean;
    notes?: string;
  } | null;
  offers: JobOffer[];
}

export default function SolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [providerOffset, setProviderOffset] = useState(0);
  const [hasMoreProviders, setHasMoreProviders] = useState(false);

  // Fetch job details
  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error("Error fetching job");
      const data = await response.json();
      setJob(data);
      return data;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la solicitud",
        variant: "destructive",
      });
      return null;
    }
  }, [jobId, toast]);

  // Fetch recommended providers
  const fetchProviders = useCallback(async (skip = 0) => {
    setIsLoadingProviders(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/providers?skip=${skip}&limit=3`);
      if (!response.ok) throw new Error("Error fetching providers");
      const data = await response.json();
      setProviders(data.providers);
      setHasMoreProviders(data.hasMore);
      setProviderOffset(skip);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las proveedoras",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  }, [jobId, toast]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const jobData = await fetchJob();
      if (jobData && (jobData.status === "BORRADOR" || jobData.status === "RECHAZADO")) {
        await fetchProviders(0);
      }
      setIsLoading(false);
    };
    loadData();
  }, [fetchJob, fetchProviders]);

  // Poll for updates when waiting for provider response
  useEffect(() => {
    if (job?.status === "PENDIENTE") {
      const interval = setInterval(() => {
        fetchJob();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [job?.status, fetchJob]);

  // Select a provider
  const handleSelectProvider = async (providerId: string) => {
    setIsSelecting(providerId);
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequestId: jobId,
          providerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al seleccionar proveedora");
      }

      toast({
        title: "¡Solicitud enviada!",
        description: "La proveedora recibirá una notificación",
        variant: "success",
      });

      // Refresh job data
      await fetchJob();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(null);
    }
  };

  // Load more providers
  const handleLoadMore = () => {
    fetchProviders(providerOffset + 3);
  };

  // Refresh providers (new random selection)
  const handleRefresh = () => {
    fetchProviders(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Solicitud no encontrada
          </h2>
          <Button onClick={() => router.push("/cliente/nueva-solicitud")}>
            Crear nueva solicitud
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Status-based rendering
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return "success";
      case "PENDIENTE":
        return "warning";
      case "RECHAZADO":
      case "CANCELADO":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const acceptedOffer = job.offers.find((o) => o.status === "ACEPTADO");

  return (
    <div className="space-y-6">
      {/* Job Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {job.serviceType === "MANICURA" ? "💅" : "🦶"}
                {getServiceLabel(job.serviceType)}
              </CardTitle>
              <CardDescription>
                {getModalityLabel(job.modality)}
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {getStatusLabel(job.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-pink-500" />
            <span>{formatDateTime(new Date(job.dateTime))}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-pink-500" />
            <span>{job.locationText}</span>
          </div>
          {job.preferences && (
            <div className="flex flex-wrap gap-2">
              {job.preferences.preferWoman && (
                <Badge variant="outline">Preferiblemente mujer</Badge>
              )}
              {job.preferences.gel && <Badge variant="outline">Gel</Badge>}
              {job.preferences.ruso && <Badge variant="outline">Ruso</Badge>}
              {job.preferences.nailArt && <Badge variant="outline">Nail art</Badge>}
              {job.preferences.notes && (
                <p className="text-sm text-gray-500 w-full mt-2">
                  Notas: {job.preferences.notes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status-specific content */}
      
      {/* CONFIRMED: Show provider details */}
      {job.status === "CONFIRMADO" && acceptedOffer && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              ¡Cita confirmada!
            </CardTitle>
            <CardDescription>
              Tu proveedora ha aceptado la cita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl">
                  {acceptedOffer.provider.name?.[0] || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {acceptedOffer.provider.name || "Proveedora"}
                </h3>
                {acceptedOffer.provider.providerProfile && (
                  <p className="text-sm text-gray-600">
                    {acceptedOffer.provider.providerProfile.city} • 
                    Desde ${acceptedOffer.provider.providerProfile.priceFrom}
                  </p>
                )}
              </div>
            </div>
            
            {acceptedOffer.provider.phone && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <Phone className="w-5 h-5 text-pink-500" />
                <span className="font-medium">{acceptedOffer.provider.phone}</span>
              </div>
            )}

            <div className="p-4 bg-white rounded-xl">
              <h4 className="font-medium mb-2">Próximos pasos</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  Espera a que la proveedora te contacte para confirmar detalles
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  Prepara el espacio si es a domicilio
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  El pago se realiza directamente con la proveedora
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PENDING: Show waiting message */}
      {job.status === "PENDIENTE" && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-8 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-amber-200 rounded-full animate-ping opacity-50" />
              <div className="relative flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Esperando respuesta de la proveedora...
            </h2>
            <p className="text-gray-600 mb-4">
              Le enviamos una notificación. Te avisaremos cuando responda.
            </p>
            <p className="text-sm text-gray-500">
              Esta página se actualiza automáticamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* BORRADOR or RECHAZADO: Show provider selection */}
      {(job.status === "BORRADOR" || job.status === "RECHAZADO") && (
        <>
          {job.status === "RECHAZADO" && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  La proveedora anterior no pudo aceptar tu cita. 
                  Elige otra opción de la lista.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Proveedoras recomendadas
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingProviders}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProviders ? "animate-spin" : ""}`} />
              Ver otras
            </Button>
          </div>

          {isLoadingProviders ? (
            <div className="space-y-4">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No hay proveedoras disponibles
                </h3>
                <p className="text-gray-600 mb-4">
                  Intenta con otra fecha u hora, o espera a que más proveedoras se unan.
                </p>
                <Button variant="outline" onClick={() => router.push("/cliente/nueva-solicitud")}>
                  Modificar solicitud
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarFallback>
                          {provider.name?.[0] || "P"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {provider.name || "Proveedora"}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{provider.profile?.city || "Ciudad no especificada"}</span>
                              {provider.distance && (
                                <span className="text-pink-600">
                                  • ~{provider.distance.toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-pink-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              {provider.profile?.priceFrom || "?"}+
                            </div>
                            {provider.profile?.rating && (
                              <div className="flex items-center gap-1 text-amber-500 text-sm">
                                <Star className="w-3 h-3 fill-current" />
                                {provider.profile.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {provider.profile?.bio && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {provider.profile.bio}
                          </p>
                        )}
                        
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectProvider(provider.id)}
                            disabled={isSelecting === provider.id}
                            className="flex-1 sm:flex-none"
                          >
                            {isSelecting === provider.id ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                Elegir
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMoreProviders && (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingProviders}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProviders ? "animate-spin" : ""}`} />
                  Ver otra opción
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* CANCELLED */}
      {job.status === "CANCELADO" && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Solicitud cancelada
            </h2>
            <Button onClick={() => router.push("/cliente/nueva-solicitud")}>
              Crear nueva solicitud
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

