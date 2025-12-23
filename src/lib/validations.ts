import { z } from "zod";

// User validations
export const updateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  phone: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .regex(/^[+]?[\d\s-]+$/, "Formato de teléfono inválido")
    .optional(),
  profilePhoto: z.string().optional().nullable(),
});

// Provider profile validations
export const providerProfileSchema = z.object({
  city: z.string().min(2, "La ciudad es requerida"),
  serviceAreaRadiusKm: z.number().min(1).max(100).optional(),
  servicesOffered: z.array(z.enum(["MANICURA", "PEDICURA"])).min(1, "Selecciona al menos un servicio"),
  priceFrom: z.number().min(0, "El precio debe ser positivo"),
  priceTo: z.number().min(0).optional().nullable(),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
  isActive: z.boolean().optional(),
  specialties: z.array(z.string()).optional(),
  portfolioPhotos: z.array(z.string()).max(10).optional(),
  salonName: z.string().optional(),
  salonAddress: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

// Job request validations
export const createJobRequestSchema = z.object({
  serviceType: z.enum(["MANICURA", "PEDICURA"]),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha y hora inválidas",
  }),
  locationText: z.string().min(5, "Ingresa una dirección o zona"),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  modality: z.enum(["A_DOMICILIO", "EN_SALON"]),
  preferences: z.object({
    preferWoman: z.boolean().optional(),
    gel: z.boolean().optional(),
    ruso: z.boolean().optional(),
    nailArt: z.boolean().optional(),
    noPreference: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  }).optional(),
});

// Job offer validations
export const createJobOfferSchema = z.object({
  jobRequestId: z.string().cuid(),
  providerId: z.string().cuid(),
});

export const respondToOfferSchema = z.object({
  offerId: z.string().cuid(),
  action: z.enum(["accept", "reject"]),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type CreateJobRequestInput = z.infer<typeof createJobRequestSchema>;
export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>;
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;

