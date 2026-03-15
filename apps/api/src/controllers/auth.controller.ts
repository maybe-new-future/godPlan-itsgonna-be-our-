import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { validationError } from "../utils/validation";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CANDIDATE", "COMPANY"]),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error));

  const { email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await hashPassword(password);

  const createdUser = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const accessToken = signAccessToken({ sub: createdUser.id, role: createdUser.role });
  const refreshToken = signRefreshToken({ sub: createdUser.id, role: createdUser.role });
  const refreshTokenHash = await hashPassword(refreshToken);

  const user = await prisma.user.update({
    where: { id: createdUser.id },
    data: { refreshTokenHash },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return res.status(201).json({ user, accessToken, refreshToken });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error));

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  return res.json({
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    accessToken,
    refreshToken,
  });
}

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function refresh(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(validationError(parsed.error));

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const isValid = await verifyPassword(parsed.data.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    const refreshTokenHash = await hashPassword(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function logout(req: Request, res: Response) {
  const userId = (req as any).user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });

  return res.json({ message: "Logged out successfully" });
}
