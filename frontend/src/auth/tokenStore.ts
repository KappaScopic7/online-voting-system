// frontend/src/auth/tokenStore.ts
const ACCESS_TOKEN_KEY = 'accessToken';
const TOKEN_EVENT = 'auth:token-changed';

function emitTokenChanged() {
    window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function onTokenChanged(handler: () => void): () => void {
    window.addEventListener(TOKEN_EVENT, handler);
    return () => window.removeEventListener(TOKEN_EVENT, handler);
}

function base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return decodeURIComponent(
        atob(padded)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
    );
}

function isJwtExpired(token: string, skewSeconds = 30): boolean {
    const parts = token.split('.');
    if (parts.length < 2) return false;

    try {
        const payloadJson = base64UrlDecode(parts[1]);
        const payload = JSON.parse(payloadJson) as { exp?: number };
        if (!payload.exp) return false;

        const now = Math.floor(Date.now() / 1000);
        return payload.exp <= now + skewSeconds;
    } catch {
        return false;
    }
}

export function getAccessToken(): string | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    if (isJwtExpired(token)) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        emitTokenChanged();
        return null;
    }

    return token;
}

export function setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    emitTokenChanged();
}

export function clearAccessToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    emitTokenChanged();
}
