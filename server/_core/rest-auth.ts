import { Router } from "express";
import { createToken, verifyToken } from "./jwt";
import * as db from "../db";
import { verifyPassword } from "../auth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

const router = Router();

/**
 * POST /api/auth/login
 * Login com email e senha
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("[REST Auth] Tentativa de login:", email);

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    // Buscar usuário
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log("[REST Auth] Usuário não encontrado:", email);
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    // Verificar senha
    if (!user.password) {
      console.log("[REST Auth] Usuário sem senha:", email);
      return res.status(401).json({
        success: false,
        message: "Usuário não possui senha configurada",
      });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      console.log("[REST Auth] Senha incorreta:", email);
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    // Criar token JWT
    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role,
    });

    console.log("[REST Auth] Token criado com sucesso para:", email);

    // Setar cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
    });

    // Atualizar last_signed_in
    await db.updateUserLastSignIn(user.id);

    console.log("[REST Auth] Login bem-sucedido:", email);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("[REST Auth] Erro no login:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get("/me", async (req, res) => {
  try {
    // Extrair token do header Authorization ou cookie
    let token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      // Tentar pegar do cookie
      token = req.cookies?.[COOKIE_NAME];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Não autenticado",
      });
    }

    // Verificar token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    // Buscar usuário
    const user = await db.getUserByEmail(payload.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("[REST Auth] Erro ao buscar usuário:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout do usuário
 */
router.post("/logout", async (req, res) => {
  try {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

    return res.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("[REST Auth] Erro no logout:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

export default router;
