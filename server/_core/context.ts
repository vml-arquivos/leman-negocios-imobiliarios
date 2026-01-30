import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyToken } from "./jwt";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Extrair token do cookie
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookie(cookieHeader);
      const token = cookies[COOKIE_NAME];
      
      if (token) {
        // Verificar token JWT
        const payload = verifyToken(token);
        
        if (payload) {
          // Buscar usuário no banco
          user = await db.db.getUserByEmail(payload.email);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error("[Context] Erro na autenticação:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
