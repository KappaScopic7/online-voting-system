// frontend/src/shared/tokenStorage.ts
const USER_KEY = "ovs_user_access_token";
const STAFF_KEY = "ovs_staff_access_token";

type TokenListener = () => void;

const userListeners = new Set<TokenListener>();
const staffListeners = new Set<TokenListener>();

function emitUser() {
    for (const fn of userListeners) fn();
}
function emitStaff() {
    for (const fn of staffListeners) fn();
}

function normalize(v: string | null): string | null {
    if (!v) return null;
    const t = v.trim();
    if (!t) return null;
    if (t === "null" || t === "undefined") return null;
    // もし誤って Bearer 付きで保存してたら剥がす（保険）
    if (t.toLowerCase().startsWith("bearer ")) return t.slice(7).trim() || null;
    return t;
}

window.addEventListener("storage", (e) => {
    if (e.key === USER_KEY) emitUser();
    if (e.key === STAFF_KEY) emitStaff();
});

export const userToken = {
    get(): string | null {
        return normalize(localStorage.getItem(USER_KEY));
    },
    set(token: string): void {
        const t = normalize(token);
        if (!t) {
            localStorage.removeItem(USER_KEY);
        } else {
            localStorage.setItem(USER_KEY, t);
        }
        emitUser();
    },
    clear(): void {
        localStorage.removeItem(USER_KEY);
        emitUser();
    },
    subscribe(listener: TokenListener): () => void {
        userListeners.add(listener);
        return () => userListeners.delete(listener);
    },
};

export const staffToken = {
    get(): string | null {
        return normalize(localStorage.getItem(STAFF_KEY));
    },
    set(token: string): void {
        const t = normalize(token);
        if (!t) {
            localStorage.removeItem(STAFF_KEY);
        } else {
            localStorage.setItem(STAFF_KEY, t);
        }
        emitStaff();
    },
    clear(): void {
        localStorage.removeItem(STAFF_KEY);
        emitStaff();
    },
    subscribe(listener: TokenListener): () => void {
        staffListeners.add(listener);
        return () => staffListeners.delete(listener);
    },
};
