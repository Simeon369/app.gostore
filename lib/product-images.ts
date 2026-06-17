import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGES = 8;

export type ProductImage = {
  url: string;
  path: string;
};

export function resolveProductImagePathFromUrl(url: string): string | null {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.substring(index + marker.length);
}

export function getProductImages(product: {
  image?: string | null;
  image_path?: string | null;
  images?: ProductImage[] | null;
}): ProductImage[] {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter((img) => img?.url);
  }

  if (product.image) {
    const path =
      product.image_path ||
      resolveProductImagePathFromUrl(product.image) ||
      "";
    return [{ url: product.image, path }];
  }

  return [];
}

export function getLeadProductImageUrl(product: {
  image?: string | null;
  image_path?: string | null;
  images?: ProductImage[] | null;
}): string | null {
  return getProductImages(product)[0]?.url || product.image || null;
}

export function getProductImageStoragePaths(product: {
  image?: string | null;
  image_path?: string | null;
  images?: ProductImage[] | null;
}): string[] {
  const paths = getProductImages(product)
    .map((img) => img.path || resolveProductImagePathFromUrl(img.url))
    .filter((path): path is string => Boolean(path));

  return [...new Set(paths)];
}

export function buildProductImagePayload(images: ProductImage[]) {
  const lead = images[0];

  return {
    images,
    image: lead?.url || null,
    image_path: lead?.path || null,
  };
}

export async function uploadProductImage(
  supabase: SupabaseClient,
  storeId: string,
  file: File,
): Promise<ProductImage> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${storeId}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
}

export async function deleteProductImagesFromStorage(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(uniquePaths);

  if (error) {
    console.error("Error deleting product images:", error);
  }
}
