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

export function sanitizeReturnTo(raw: unknown, fallback: string = "/"): string {
    if (typeof raw !== "string") return fallback;

    // 外部URL/スキームを拒否（//evil.com, http://... など）
    if (!raw.startsWith("/")) return fallback;
    if (raw.startsWith("//")) return fallback;

    // auth配下に戻すのは禁止（ループ防止）
    if (isAuthPath(raw)) return fallback;

    return raw;
}

/**
 * 「今のURLをfromにする」用途。authページ自身なら null を返す。
 */
export function currentAsFrom(pathname: string, search: string): string | null {
    const here = `${pathname}${search ?? ""}`;
    if (isAuthPath(pathname)) return null;
    return here;
}
