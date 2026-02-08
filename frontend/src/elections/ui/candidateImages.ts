// frontend/src/elections/ui/candidateImages.ts

const assetUrl = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

function normalizeKey(raw?: string | null): string | null {
    if (!raw) return null;
    const s = raw.trim();
    if (!s) return null;
    return s.toLowerCase().replace(/-/g, "_");
}

function tryExtractNumber(key: string): number | null {
    // 例: cand_001 / cand001 / candidate_12 / cand-12 etc...
    const m = key.match(/(\d{1,4})$/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * candidateKey から assets の画像パスを返す
 * assets/candidates/candidate-001.png のような番号形式を想定
 */
export function resolveCandidateImageUrl(
    candidateKey?: string | null,
): string | null {
    const key = normalizeKey(candidateKey);
    if (!key) return null;

    // 1) 末尾数字から推測（運用がラク）
    const extracted = tryExtractNumber(key);
    if (extracted) {
        const padded = String(extracted).padStart(3, "0");
        return assetUrl(`assets/candidates/candidate-${padded}.png`);
    }

    // 2) 固定マップ（例外対応用）
    const map: Record<string, number> = {
        cand_suzuki: 1,
        cand_tanaka: 2,
        cand_mori: 3,
        cand_kato: 4,
        cand_nakamura: 5,
    };

    const n = map[key];
    if (!n) {
        if (import.meta.env.DEV) {
            console.warn(
                `[candidateImages] no image mapping for key="${key}" raw="${candidateKey}"`,
            );
        }
        return null;
    }

    const padded = String(n).padStart(3, "0");
    return assetUrl(`assets/candidates/candidate-${padded}.png`);
}
