// shared/tokenStorage.ts
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

// 別タブ/別ウィンドウ同期（同一タブでの set/remove では発火しない点に注意）
window.addEventListener("storage", (e) => {
    if (e.key === USER_KEY) emitUser();
    if (e.key === STAFF_KEY) emitStaff();
});

export const userToken = {
    get(): string | null {
        return localStorage.getItem(USER_KEY);
    },
    set(token: string): void {
        localStorage.setItem(USER_KEY, token);
        emitUser(); // 同一タブ即時反映
    },
    clear(): void {
        localStorage.removeItem(USER_KEY);
        emitUser(); // 同一タブ即時反映
    },
    subscribe(listener: TokenListener): () => void {
        userListeners.add(listener);
        return () => userListeners.delete(listener);
    },
};

export const staffToken = {
    get(): string | null {
        return localStorage.getItem(STAFF_KEY);
    },
    set(token: string): void {
        localStorage.setItem(STAFF_KEY, token);
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
