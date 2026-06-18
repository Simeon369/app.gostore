function canUseSessionStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const key = "__gostore_storage_test__";
    window.sessionStorage.setItem(key, "1");
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getSessionItem(key: string): string | null {
  if (!canUseSessionStorage()) return null;

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSessionItem(key: string, value: string): boolean {
  if (!canUseSessionStorage()) return false;

  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeSessionItem(key: string): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Safari private mode and some mobile browsers block storage.
  }
}
