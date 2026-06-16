import type { SupabaseClient } from "@supabase/supabase-js";

export const STORE_LOGOS_BUCKET = "store-logos";
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function resolveLogoPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${STORE_LOGOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Please upload JPG, PNG, or WebP";
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "Logo must be 2MB or less";
  }
  return null;
}

export async function uploadStoreLogo(
  supabase: SupabaseClient,
  storeId: string,
  file: File,
  existingLogoPath?: string | null,
): Promise<{ logoUrl: string; logoPath: string }> {
  const validationError = validateLogoFile(file);
  if (validationError) throw new Error(validationError);

  if (existingLogoPath) {
    await supabase.storage.from(STORE_LOGOS_BUCKET).remove([existingLogoPath]);
  }

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${storeId}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORE_LOGOS_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORE_LOGOS_BUCKET).getPublicUrl(filePath);

  return { logoUrl: publicUrl, logoPath: filePath };
}
