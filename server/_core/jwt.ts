import jwt from "jsonwebtoken";
import { ENV } from "./env";

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Cria um token JWT para autenticação
 */
export function createToken(payload: JWTPayload): string {
  const secret = ENV.jwtSecret;
  
  if (!secret || secret.trim() === "") {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "365d", // 1 ano
    issuer: "leman-crm",
  });
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = ENV.jwtSecret;
    
    if (!secret || secret.trim() === "") {
      console.error("[JWT] JWT_SECRET não configurado");
      return null;
    }

    const decoded = jwt.verify(token, secret, {
      issuer: "leman-crm",
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error("[JWT] Erro ao verificar token:", error);
    return null;
  }
}
