import { z } from "zod";

const SignupScheme = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a special character"),
});
