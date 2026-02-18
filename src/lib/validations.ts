import { z } from "zod";

/**
 * Validação de username do Instagram
 */
export const usernameSchema = z.string()
  .min(1, "Username é obrigatório")
  .max(30, "Username muito longo")
  .regex(/^[a-zA-Z0-9._]+$/, "Username contém caracteres inválidos")
  .refine((val) => !val.startsWith(".") && !val.endsWith("."), {
    message: "Username não pode começar ou terminar com ponto"
  });

/**
 * Validação de hashtag
 */
export const hashtagSchema = z.string()
  .min(1, "Hashtag é obrigatória")
  .max(100, "Hashtag muito longa")
  .regex(/^#?[a-zA-Z0-9_]+$/, "Formato de hashtag inválido")
  .transform((val) => val.startsWith("#") ? val : `#${val}`);

/**
 * Validação de comentário
 */
export const commentSchema = z.string()
  .min(1, "Comentário não pode estar vazio")
  .max(2200, "Comentário muito longo (máximo 2200 caracteres)")
  .refine((val) => val.trim().length > 0, {
    message: "Comentário não pode conter apenas espaços"
  });

/**
 * Validação de limites diários
 */
export const dailyLimitSchema = z.number()
  .int("Deve ser um número inteiro")
  .min(0, "Não pode ser negativo")
  .max(1000, "Limite muito alto (máximo 1000)");

/**
 * Validação de delay
 */
export const delaySchema = z.object({
  min: z.number().int().min(5, "Delay mínimo deve ser pelo menos 5 segundos").max(300),
  max: z.number().int().min(5, "Delay máximo deve ser pelo menos 5 segundos").max(600)
}).refine((data) => data.min <= data.max, {
  message: "Delay mínimo deve ser menor ou igual ao máximo",
  path: ["max"]
});

/**
 * Validação de filtros de target
 */
export const targetFilterSchema = z.object({
  minFollowers: z.number().int().min(0).optional(),
  maxFollowers: z.number().int().min(0).optional(),
  minFollowing: z.number().int().min(0).optional(),
  maxFollowing: z.number().int().min(0).optional(),
  minPosts: z.number().int().min(0).optional(),
  isPrivate: z.boolean().optional(),
  isVerified: z.boolean().optional(),
}).refine((data) => {
  if (data.minFollowers && data.maxFollowers) {
    return data.minFollowers <= data.maxFollowers;
  }
  return true;
}, {
  message: "Seguidores mínimos deve ser menor ou igual ao máximo",
  path: ["maxFollowers"]
});

/**
 * Validação de email
 */
export const emailSchema = z.string()
  .email("Email inválido")
  .toLowerCase()
  .trim();

/**
 * Validação de senha
 */
export const passwordSchema = z.string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");
