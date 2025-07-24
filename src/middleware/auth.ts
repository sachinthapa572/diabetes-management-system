import appEnv from "@/validation/env";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/db";

export const isAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, appEnv.JWT_SECRET) as JsonPlayload;

    //   call the database to get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export function requireRole(role: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== role.toUpperCase() && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
}

type JsonPlayload = {
  id: string;
};

export function generateToken(id: string): string {
  return jwt.sign({ id }, appEnv.JWT_SECRET, { expiresIn: "24h" });
}

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: object
) {
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId || null,
      details: details ? details : undefined,
    },
  });
}
