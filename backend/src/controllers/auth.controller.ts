import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";
import { AuthenticatedRequest } from "../types/auth.js";

/**
 * Handle new user registration.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { name, phoneNumber, email, password, role } = parseResult.data;
    const normalizedEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : undefined;

    // Check for existing user by phone or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.phoneNumber === phoneNumber ? "Phone number" : "Email";
      res.status(409).json({
        success: false,
        message: `${field} is already registered. Please login instead.`,
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Create user and initial cart if customer
    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        email: normalizedEmail || null,
        password: hashedPassword,
        role: role || Role.CUSTOMER,
        cart: role === Role.CUSTOMER ? { create: {} } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = signAccessToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const meta = (error as { meta?: { target?: string | string[] } }).meta;
      const target = typeof meta?.target === "string" ? meta.target : (Array.isArray(meta?.target) ? meta.target.join(" ") : "");
      const isPhone = target.includes("phoneNumber");
      res.status(409).json({
        success: false,
        message: `${isPhone ? "Phone number" : "Email"} is already registered. Please login instead.`,
      });
      return;
    }
    console.error("Registration error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
}

/**
 * Handle user login.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { identifier, password } = parseResult.data;

    // Find user by phone number or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid phone number/email or password",
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid phone number/email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "User account has been deactivated. Please contact support.",
      });
      return;
    }

    const token = signAccessToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
}

/**
 * Get current authenticated user's profile.
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      user: req.user,
    },
  });
}
