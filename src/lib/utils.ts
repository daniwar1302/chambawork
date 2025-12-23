import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} a las ${formatTime(date)}`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getServiceLabel(serviceType: string): string {
  const labels: Record<string, string> = {
    MANICURA: "Manicura",
    PEDICURA: "Pedicura",
  };
  return labels[serviceType] || serviceType;
}

export function getModalityLabel(modality: string): string {
  const labels: Record<string, string> = {
    A_DOMICILIO: "A domicilio",
    EN_SALON: "En salón",
  };
  return labels[modality] || modality;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BORRADOR: "Borrador",
    PENDIENTE: "Esperando respuesta",
    CONFIRMADO: "Confirmado",
    RECHAZADO: "Rechazado",
    CANCELADO: "Cancelado",
    COMPLETADO: "Completado",
  };
  return labels[status] || status;
}

export function getOfferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ENVIADO: "Pendiente",
    ACEPTADO: "Aceptado",
    RECHAZADO: "Rechazado",
  };
  return labels[status] || status;
}

