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

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    emitTokenChanged(); // ★同一タブにも通知
}

export function clearAccessToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    emitTokenChanged(); // ★同一タブにも通知
}
