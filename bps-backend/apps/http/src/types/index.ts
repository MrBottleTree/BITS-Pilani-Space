import { z } from "zod";

export const RoleSchema = z.enum(["USER", "ADMIN"]);

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
        .max(128, "Password too long")
        .superRefine((val, ctx) => {
            if (/\s/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must not contain whitespace" });
            }
            if (/[\x00-\x1F\x7F]/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must not contain control characters" });
            }
            if (!/[a-z]/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must contain a lowercase letter" });
            }
            if (!/[A-Z]/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must contain an uppercase letter" });
            }
            if (!/[0-9]/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must contain a number" });
            }
            if (!/[!@#$%^&*(),.?":{}|<>[\]\\\/~`+=_-]/.test(val)) {
                ctx.addIssue({ code: "custom", message: "Password must contain a special character" });
            }
        }),
    role: RoleSchema
}).strict();

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

export const UserScheme = z.object({
    userId: z.string(),
    email: z.email(),
    role: RoleSchema
});

export const AuthorizationHeaderSchema = z.object({
  authorization: z
    .string()
    .startsWith("Bearer ", { message: "Must be a Bearer token" })
    .transform((val) => val.split(" ")[1]) 
});