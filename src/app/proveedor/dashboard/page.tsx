"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { 
  getServiceLabel, 
  getModalityLabel, 
  formatDateTime 
} from "@/lib/utils";
import { 
  Sparkles, 
  MapPin, 
  Calendar,  
  Check,
  X,
  Phone,
  Clock,
  Inbox,
  CheckCircle2,
  History
} from "lucide-react";

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
  client: {
    id: string;
    name: string | null;
    phone: string | null;
  };
}

interface JobOffer {
  id: string;
  status: string;
  sentAt: string;
  respondedAt: string | null;
  jobRequest: JobRequest;
}

type TabValue = "pending" | "confirmed" | "history";

export default function ProveedorDashboardPage() {
  const { toast } = useToast();
  
  const [, setActiveTab] = useState<TabValue>("pending");
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Fetch offers
  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch("/api/offers/provider");
      if (!response.ok) throw new Error("Error fetching offers");
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOffers();
    
    // Poll for new offers every 30 seconds
    const interval = setInterval(fetchOffers, 30000);
    return () => clearInterval(interval);
  }, [fetchOffers]);

  // Respond to offer
  const handleRespond = async (offerId: string, action: "accept" | "reject") => {
    setRespondingTo(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al responder");
      }

      await response.json();
      
      toast({
        title: action === "accept" ? "¡Cita confirmada!" : "Solicitud rechazada",
        description: action === "accept" 
          ? "La clienta será notificada"
          : "La clienta podrá elegir otra proveedora",
        variant: action === "accept" ? "success" : "default",
      });

      // Refresh offers
      await fetchOffers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo responder",
        variant: "destructive",
      });
    } finally {
      setRespondingTo(null);
    }
  };

  // Filter offers by status
  const pendingOffers = offers.filter((o) => o.status === "ENVIADO");
  const confirmedOffers = offers.filter((o) => o.status === "ACEPTADO");
  const historyOffers = offers.filter((o) => o.status === "RECHAZADO");

  const renderOfferCard = (offer: JobOffer, showActions = false) => {
    const job = offer.jobRequest;
    const isResponding = respondingTo === offer.id;

    return (
      <Card key={offer.id} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Service type header */}
          <div className={`p-3 ${
            job.serviceType === "MANICURA" 
              ? "bg-gradient-to-r from-pink-100 to-pink-50" 
              : "bg-gradient-to-r from-purple-100 to-purple-50"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {job.serviceType === "MANICURA" ? "💅" : "🦶"}
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    {getServiceLabel(job.serviceType)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {getModalityLabel(job.modality)}
                  </p>
                </div>
              </div>
              <Badge variant={offer.status === "ACEPTADO" ? "success" : "secondary"}>
                {offer.status === "ENVIADO" && "Pendiente"}
                {offer.status === "ACEPTADO" && "Confirmado"}
                {offer.status === "RECHAZADO" && "Rechazado"}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Client info */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {job.client.name?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{job.client.name || "Clienta"}</p>
                {offer.status === "ACEPTADO" && job.client.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    {job.client.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Date and location */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>{formatDateTime(new Date(job.dateTime))}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-pink-500" />
                <span>{job.locationText}</span>
              </div>
            </div>

            {/* Preferences */}
            {job.preferences && (
              <div className="flex flex-wrap gap-1">
                {job.preferences.preferWoman && (
                  <Badge variant="outline" className="text-xs">Pref. mujer</Badge>
                )}
                {job.preferences.gel && (
                  <Badge variant="outline" className="text-xs">Gel</Badge>
                )}
                {job.preferences.ruso && (
                  <Badge variant="outline" className="text-xs">Ruso</Badge>
                )}
                {job.preferences.nailArt && (
                  <Badge variant="outline" className="text-xs">Nail art</Badge>
                )}
                {job.preferences.notes && (
                  <p className="text-xs text-gray-500 w-full mt-1">
                    &ldquo;{job.preferences.notes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Actions for pending offers */}
            {showActions && offer.status === "ENVIADO" && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRespond(offer.id, "reject")}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleRespond(offer.id, "accept")}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Aceptar
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Contact info for confirmed offers */}
            {offer.status === "ACEPTADO" && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">
                  ¡Cita confirmada!
                </p>
                <p className="text-xs text-green-600">
                  Contacta a la clienta para coordinar los detalles finales.
                </p>
              </div>
            )}

            {/* Received time */}
            <div className="flex items-center gap-1 text-xs text-gray-400 pt-2">
              <Clock className="w-3 h-3" />
              Recibido: {new Date(offer.sentAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: TabValue) => {
    const config = {
      pending: {
        icon: <Inbox className="w-12 h-12 text-gray-300" />,
        title: "Sin solicitudes pendientes",
        description: "Cuando recibas nuevas solicitudes, aparecerán aquí",
      },
      confirmed: {
        icon: <CheckCircle2 className="w-12 h-12 text-gray-300" />,
        title: "Sin citas confirmadas",
        description: "Las citas que aceptes aparecerán aquí",
      },
      history: {
        icon: <History className="w-12 h-12 text-gray-300" />,
        title: "Sin historial",
        description: "Tu historial de solicitudes aparecerá aquí",
      },
    };

    const { icon, title, description } = config[type];

    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-700 font-medium">
            Panel de solicitudes
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          Tus solicitudes
        </h1>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{pendingOffers.length}</p>
            <p className="text-xs text-amber-600">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{confirmedOffers.length}</p>
            <p className="text-xs text-green-600">Confirmadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{historyOffers.length}</p>
            <p className="text-xs text-gray-600">Historial</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {pendingOffers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingOffers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmadas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : (
          <>
            <TabsContent value="pending" className="space-y-4">
              {pendingOffers.length === 0
                ? renderEmptyState("pending")
                : pendingOffers.map((offer) => renderOfferCard(offer, true))}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              {confirmedOffers.length === 0
                ? renderEmptyState("confirmed")
                : confirmedOffers.map((offer) => renderOfferCard(offer))}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {historyOffers.length === 0
                ? renderEmptyState("history")
                : historyOffers.map((offer) => renderOfferCard(offer))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

