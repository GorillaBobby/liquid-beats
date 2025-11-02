import { z } from "zod";

// Message validation
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message est trop long (maximum 2000 caractères)"),
});

// Feedback validation
export const feedbackSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Le sujet ne peut pas être vide")
    .max(200, "Le sujet est trop long (maximum 200 caractères)"),
  message: z
    .string()
    .trim()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message est trop long (maximum 2000 caractères)"),
});

// Track upload validation
export const trackSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis")
    .max(200, "Le titre est trop long (maximum 200 caractères)")
    .regex(/^[a-zA-Z0-9\s\-_'"àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]+$/, "Caractères invalides dans le titre"),
  artistName: z
    .string()
    .trim()
    .min(1, "Le nom de l'artiste est requis")
    .max(100, "Le nom de l'artiste est trop long (maximum 100 caractères)"),
  description: z
    .string()
    .max(1000, "La description est trop longue (maximum 1000 caractères)")
    .optional(),
  lyrics: z
    .string()
    .max(10000, "Les paroles sont trop longues (maximum 10000 caractères)")
    .optional(),
});

// Profile update validation
export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(100, "Le nom d'affichage est trop long (maximum 100 caractères)")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "La biographie est trop longue (maximum 500 caractères)")
    .optional(),
});

// Admin password reset validation
export const passwordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format d'email invalide"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});
