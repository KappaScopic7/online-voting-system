const KEY = "ovs_access_token";

type Listener = () => void;
let listeners: Listener[] = [];

function emit() {
    for (const l of listeners) l();
}

export function subscribeTokenChange(fn: Listener): () => void {
    listeners.push(fn);
    return () => {
        listeners = listeners.filter((x) => x !== fn);
    };
}

export function getToken(): string | null {
    return localStorage.getItem(KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(KEY, token);
    emit();
}

export function clearToken(): void {
    localStorage.removeItem(KEY);
    emit();
}
