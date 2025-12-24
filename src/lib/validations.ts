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

// Tutor profile validations
export const tutorProfileSchema = z.object({
  subjects: z.array(z.string()).min(1, "Selecciona al menos una materia"),
  gradeLevels: z.array(z.string()).min(1, "Selecciona al menos un nivel"),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  schedulingLink: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type TutorProfileInput = z.infer<typeof tutorProfileSchema>;
