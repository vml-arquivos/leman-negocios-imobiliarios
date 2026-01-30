import bcrypt from "bcryptjs";

/**
 * Hash a password using bcrypt
 * Compatible with Supabase bcrypt hashes ($2a$10$ or $2b$10$)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a stored bcrypt hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error("[Auth] Error verifying password:", error);
    return false;
  }
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 letter and 1 number
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Senha deve ter no mínimo 8 caracteres" };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Senha deve conter pelo menos uma letra" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Senha deve conter pelo menos um número" };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
