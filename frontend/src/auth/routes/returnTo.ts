// frontend/src/auth/routes/returnTo.ts
export const AUTH_PATH_PREFIXES = [
    "/login",
    "/register",
    "/verify",
    "/verify-email",
    "/password",
] as const;

export function isAuthPath(pathname: string): boolean {
    return AUTH_PATH_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
    );
}
const BLOCKED = new Set(["/login", "/register", "/verify", "/password/forgot"]);

export function sanitizeReturnTo(from?: string, fallback = "/"): string {
    if (!from || typeof from !== "string") return fallback;
    if (!from.startsWith("/")) return fallback;

    for (const b of BLOCKED) {
        if (from === b || from.startsWith(b + "/")) {
            return fallback;
        }
    }
    return from;
}

/**
 * 「今のURLをfromにする」用途。authページ自身なら null を返す。
 */
export function currentAsFrom(pathname: string, search: string): string | null {
    const here = `${pathname}${search ?? ""}`;
    if (isAuthPath(pathname)) return null;
    return here;
}
