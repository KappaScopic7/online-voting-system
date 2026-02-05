// frontend/src/elections/ui/candidateImages.ts

const assetUrl = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

/**
 * candidateKey から assets の画像パスを返す
 * 例: cand_suzuki -> assets/candidates/candidate-001.png
 */
export function resolveCandidateImageUrl(
    candidateKey?: string | null,
): string | null {
    if (!candidateKey) return null;

    // ここは君の既存ルールに合わせてOK（例：キー順で採番しているならその表）
    // とりあえず例として "cand_xxx" の末尾で分岐するなら map を持つ
    const map: Record<string, number> = {
        cand_suzuki: 1,
        cand_tanaka: 2,
        cand_mori: 3,
        cand_kato: 4,
        cand_nakamura: 5,
    };

    const n = map[candidateKey];
    if (!n) {
        if (import.meta.env.DEV) {
            console.warn(
                `[candidateImages] no image mapping for key: ${candidateKey}`,
            );
        }
        return null;
    }

    const padded = String(n).padStart(3, "0");
    return assetUrl(`assets/candidates/candidate-${padded}.png`);
}
