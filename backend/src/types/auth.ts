import { Role } from "@prisma/client";
import { Request } from "express";

export interface TokenPayload {
  userId: string;
  role: Role;
  phoneNumber: string;
  email?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type AuthenticatedRequest = Request;
