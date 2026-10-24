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
    securityQuestion: z.string().trim().min(5, "Informe uma pergunta de recuperacao.").max(200),
    securityAnswer: z.string().trim().min(2, "Informe a resposta de recuperacao.").max(120),
    confirmSecurityAnswer: z.string().trim().min(2, "Confirme a resposta de recuperacao.").max(120),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.securityAnswer === data.confirmSecurityAnswer, {
    message: "As respostas de recuperacao nao coincidem.",
    path: ["confirmSecurityAnswer"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email(),
    securityAnswer: z.string().trim().min(2).max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });
