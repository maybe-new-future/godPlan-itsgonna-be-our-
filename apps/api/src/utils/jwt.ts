import jwt from "jsonwebtoken";
import { env } from "../config/env";

const accessSecret = env.JWT_SECRET;
const refreshSecret = env.JWT_REFRESH_SECRET;
const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as jwt.SignOptions["expiresIn"];
const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export type JwtPayload = { sub: string; role: string };

export function signAccessToken(payload: object) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload;
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload;
}
