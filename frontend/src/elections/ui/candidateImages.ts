const assetUrl = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

/**
 * candidateKey から public/assets/candidates/<KEY>.png を返す
 *
 * 例:
 * - TD01 -> /assets/candidates/TD01.png
 * - J01  -> /assets/candidates/J01.png
 * - PR_LDP -> /assets/candidates/PR_LDP.png（置くなら）
 *
 * NOTE:
 * - Linux(EC2)は大文字小文字を区別するので、ファイル名と key の大小を揃えること。
 */
export function resolveCandidateImageUrl(
    candidateKey?: string | null,
): string | null {
    const raw = (candidateKey ?? "").trim();
    if (!raw) return null;

    // ★ ここが重要：勝手に toLowerCase しない（EC2で死ぬ）
    // もし「常に大文字ファイル名」で統一するなら raw.toUpperCase() にしてOK
    const key = raw;

    return assetUrl(`assets/candidates/${key}.png`);
}
