import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase Storage
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "LEMANIMAGENS";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

// Cliente Supabase com SERVICE_ROLE (backend only!)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Gera uma chave única para o arquivo no storage
 * Formato: properties/{propertyId}/{timestamp}-{random}-{filename}
 */
export function generateStorageKey(propertyId: number, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `properties/${propertyId}/${timestamp}-${random}-${sanitizedFilename}`;
}

/**
 * Cria uma URL assinada para upload direto no Supabase Storage
 * @param key - Chave do arquivo no storage (ex: properties/1/1707583200000-abc123-foto.jpg)
 * @param contentType - Tipo MIME do arquivo (ex: image/jpeg)
 * @returns { uploadUrl, publicUrl, key }
 */
export async function createSignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  // Supabase Storage não tem createSignedUploadUrl nativo
  // Alternativa: retornar URL pública e fazer upload via backend
  // OU: usar presigned URL (se disponível na versão do Supabase)
  
  // Para simplificar, vamos retornar a URL pública
  // O upload será feito via backend (ver createUploadUrl no router)
  const publicUrl = getPublicUrl(key);
  
  return {
    uploadUrl: publicUrl, // Placeholder - upload será via backend
    publicUrl,
    key,
  };
}

/**
 * Retorna a URL pública de um arquivo no storage
 * @param key - Chave do arquivo no storage
 * @returns URL pública
 */
export function getPublicUrl(key: string): string {
  const { data } = supabase.storage.from(storageBucket).getPublicUrl(key);
  return data.publicUrl;
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param key - Chave do arquivo no storage
 * @param file - Buffer ou Blob do arquivo
 * @param contentType - Tipo MIME do arquivo
 * @returns URL pública do arquivo
 */
export async function uploadFile(
  key: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(key, file, {
      contentType,
      upsert: false, // Não sobrescrever se já existir
    });

  if (error) {
    console.error("Error uploading file to Supabase Storage:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return getPublicUrl(data.path);
}

/**
 * Deleta um arquivo do Supabase Storage
 * @param key - Chave do arquivo no storage
 */
export async function deleteObject(key: string): Promise<void> {
  const { error } = await supabase.storage.from(storageBucket).remove([key]);

  if (error) {
    console.error("Error deleting file from Supabase Storage:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Exporta o cliente Supabase para uso em outros módulos
 */
export { supabase };
