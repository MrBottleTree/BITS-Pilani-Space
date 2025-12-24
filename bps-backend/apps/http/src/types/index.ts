import { z } from "zod";

export const SignupScheme = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may contain only letters, digits, and underscore"), // Violation of this should be shown to the user as well

  email: z
    .email("Invalid email address")
    .trim()
    .max(254, "Email too long")
    .transform(v => v.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

export const SigninScheme = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Identifier is required")
    .max(254, "Identifier too long"), // Check in the backend before doing a database hit

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});