/**
 * Sistema de Autenticação Simplificado
 * Leman Negócios Imobiliários
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import { db } from "./db";

const router = Router();

// ============================================
// CONFIGURAÇÕES JWT
// ============================================

const JWT_SECRET = new TextEncoder().encode(ENV.JWT_SECRET);
const JWT_EXPIRES_IN = "7d"; // 7 dias

/**
 * Gerar token JWT
 */
async function generateToken(userId: number, email: string, role: string): Promise<string> {
  const token = await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verificar token JWT
 */
async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// ============================================
// ROTA: POST /api/auth/login
// ============================================

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios"
      });
    }

    console.log(`[Auth] Tentativa de login: ${email}`);

    // Buscar usuário no banco
    const user = await db.getUserByEmail(email);

    if (!user) {
      console.log(`[Auth] Usuário não encontrado: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos"
      });
    }

    // Verificar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(`[Auth] Senha incorreta para: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos"
      });
    }

    // Gerar token JWT
    const token = await generateToken(user.id, user.email, user.role);

    // Atualizar último login
    await db.updateUserLastSignIn(user.id);

    console.log(`[Auth] ✅ Login bem-sucedido: ${email}`);

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error: any) {
    console.error("[Auth] Erro no login:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// ============================================
// ROTA: GET /api/auth/me
// ============================================

router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido"
      });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado"
      });
    }

    // Buscar usuário atualizado
    const user = await db.getUserByEmail(payload.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error: any) {
    console.error("[Auth] Erro ao verificar usuário:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message
    });
  }
});

// ============================================
// ROTA: POST /api/auth/logout
// ============================================

router.post("/logout", async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Logout realizado com sucesso"
  });
});

export default router;
