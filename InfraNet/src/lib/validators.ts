import { z } from "zod";
import { isPasswordValid } from "./password";

const passwordSchema = z
  .string()
  .refine(isPasswordValid, {
    message: "A senha nao atende aos requisitos minimos.",
  });

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Informe seu nome."),
    lastName: z.string().trim().optional(),
    email: z.string().trim().email("Informe um e-mail valido."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
  rememberMe: z.boolean().optional().default(false),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().length(6, "O codigo deve ter 6 digitos."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email(),
    code: z.string().length(6, "O codigo deve ter 6 digitos."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });
