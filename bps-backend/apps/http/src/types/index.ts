import { z } from "zod";

export const RoleSchema = z.enum(["USER", "ADMIN"]);

export const MimeSchema = z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const PasswordSchema = z
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
    });

export const SignupSchema = z.object({
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

    password: PasswordSchema,
    role: RoleSchema
}).strict();

export const SigninSchema = z.object({
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

export const UserSchema = z.object({
    userId: z.string(),
    username: z.string(),
    email: z.email(),
    role: RoleSchema
});

export const AuthorizationHeaderSchema = z.object({
  authorization: z
    .string()
    .startsWith("Bearer ", { message: "Must be a Bearer token" })
    .transform((val) => val.split(" ")[1]) 
});

export const BatchUserDeletionSchema = z.object({
  userIds: z
    .array(z.string().min(1, "ID cannot be empty"))
    .min(1, "At least one ID is required")
    .max(1000, "Cannot delete more than 1000 users at once")
});

export const UpdateUserSchema = z.object({
    id: z.string().optional(),

    password: z.string().min(1, { message: "Current password is required" }),

    user: z.object({
        new_username: z
            .string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(32, "Username must be at most 32 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Username may contain only letters, digits, and underscore"),

        new_email: z
            .email("Invalid email address")
            .trim()
            .max(254, "Email too long")
            .transform(v => v.toLowerCase()),

        new_password: PasswordSchema,

        new_avatar: z.string()
    }).partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field (username, email, or new password) must be provided to update.",
    }), 
}).strict();

export const AvatarMetadataSchema = z.object({
    name: z.string().min(1, "Avatar name is required").max(50),
}).strict();

export const AvatarFileSchema = z.object({
    fieldname: z.literal("avatar"),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: MimeSchema,
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
    buffer: z.instanceof(Buffer, {message: "File buffer is missing or invalid"})
}).strict();