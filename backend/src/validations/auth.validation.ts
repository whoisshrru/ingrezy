import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9+]{10,13}$/, "Please enter a valid phone number (10 to 13 digits)"),
  email: z.string().trim().email("Please provide a valid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z
    .nativeEnum(Role)
    .optional()
    .default(Role.CUSTOMER)
    .refine((role) => role !== Role.ADMIN, {
      message: "Direct registration as ADMIN is not permitted. Please contact platform support.",
    }),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Please provide your phone number or email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
