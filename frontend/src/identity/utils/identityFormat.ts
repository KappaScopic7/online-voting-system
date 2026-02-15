// frontend/src/identity/utils/identityFormat.ts

/** UUID入力：hex以外を除去 → 32桁まで → 8-4-4-4-12 でハイフン挿入 */
export function formatUuidInput(raw: string): string {
    const hex = String(raw ?? "")
        .toLowerCase()
        .replace(/[^0-9a-f]/g, "");
    const s = hex.slice(0, 32);

    const p1 = s.slice(0, 8);
    const p2 = s.slice(8, 12);
    const p3 = s.slice(12, 16);
    const p4 = s.slice(16, 20);
    const p5 = s.slice(20, 32);

    const parts = [p1, p2, p3, p4, p5].filter((p) => p.length > 0);
    return parts.join("-");
}
