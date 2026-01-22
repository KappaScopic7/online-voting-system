// shared/normalizeFrom.ts

const DEFAULT_FROM = "/elections";

export function normalizeFrom(from?: string): string {
    const f = (from ?? "").trim();

    if (!f) return DEFAULT_FROM;

    // 外部URL・相対・怪しいものは弾く
    if (!f.startsWith("/") || f.startsWith("//")) {
        return DEFAULT_FROM;
    }

    // ---- legacy routes rescue ----

    // 旧トップ
    if (f === "/") return DEFAULT_FROM;

    // old my routes
    if (f === "/votes") return "/me/votes";

    // old identity routes
    if (f === "/identity/link") return "/me/identity";
    if (f === "/identity/pending") return "/me/identity/pending";

    // elections はそのまま
    if (f === "/elections") return "/elections";

    return f;
}
