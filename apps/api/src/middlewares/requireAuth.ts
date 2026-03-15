import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);

    // attach user info to request
    (req as any).user = { id: payload.sub, role: payload.role };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
