// Lightweight JWT payload decoder (no signature verification)
export function decodeJwtPayload<T = Record<string, any>>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getTokenRole(token?: string | null): string | null {
  const payload = decodeJwtPayload<{ role?: string }>(token || '');
  return payload?.role || null;
}
