function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getAppBaseUrl(): string {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || "https://app-gostore.vercel.app",
  );
}

export function getMarketingBaseUrl(): string {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_MARKETING_URL || "https://home-gostore.vercel.app",
  );
}

export function getAppHost(): string {
  return getAppBaseUrl().replace(/^https?:\/\//, "");
}

export function getStoreUrl(slug: string, params?: Record<string, string>): string {
  const url = new URL(`/store/${slug}`, `${getAppBaseUrl()}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

export function getProductUrl(
  slug: string,
  productId: string,
  params?: Record<string, string>,
): string {
  const url = new URL(`/store/${slug}/product/${productId}`, `${getAppBaseUrl()}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

export function getSignupUrl(): string {
  return `${getAppBaseUrl()}/signup`;
}

export function getLoginUrl(): string {
  return `${getAppBaseUrl()}/login`;
}

export function getOrderTrackingUrl(
  slug: string,
  orderId: string,
): string {
  return `${getAppBaseUrl()}/store/${slug}/track?orderId=${orderId}`;
}
