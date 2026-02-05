// frontend/src/shared/ui/CandidateAvatar.tsx
import { useEffect, useMemo, useState } from "react";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

type Props = {
    name: string;
    imageUrl?: string | null; // APIから来る可能性
    candidateKey?: string | null; // ★ 追加: candidateKeyでassetsを解決
    index?: number; // 互換: 並び順でassetsに落とす用（なるべく使わない）
    size?: number;
};

const assetUrl = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

function fallbackByIndex(index?: number) {
    if (index === undefined) return null;
    const n = index + 1;
    const padded = String(n).padStart(3, "0");
    return assetUrl(`assets/candidates/candidate-${padded}.png`);
}

function normalizeImageUrl(imageUrl?: string | null) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    // "/assets/..." でも "assets/..." でも OK にする
    return assetUrl(imageUrl);
}

export function CandidateAvatar({
    name,
    imageUrl,
    candidateKey,
    index,
    size = 48,
}: Props) {
    const primary = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);

    // 上のコメント通り二重化を避ける：resolveCandidateImageUrlがBASE_URL込みを返す実装なので
    const byKeySafe = useMemo(
        () => resolveCandidateImageUrl(candidateKey),
        [candidateKey],
    );

    const byIndex = useMemo(() => fallbackByIndex(index), [index]);

    // 表示優先順位: API画像 > candidateKey assets > index assets
    const initial = primary ?? byKeySafe ?? byIndex;

    const [src, setSrc] = useState<string | null>(initial);

    // props変化で追従（ページ遷移時のズレ防止）
    useEffect(() => {
        setSrc(primary ?? byKeySafe ?? byIndex);
    }, [primary, byKeySafe, byIndex]);

    const handleError = () => {
        // 失敗時のフォールバック順:
        // API画像 -> candidateKey assets -> index assets -> null
        if (src && src === primary) {
            setSrc(byKeySafe ?? byIndex);
            return;
        }
        if (src && src === byKeySafe) {
            setSrc(byIndex);
            return;
        }
        setSrc(null);
    };

    return src ? (
        <img
            src={src}
            alt={name}
            width={size}
            height={size}
            style={{
                width: size,
                height: size,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid #eee",
                flexShrink: 0,
                background: "#fafafa",
            }}
            onError={handleError}
        />
    ) : (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 10,
                border: "1px dashed #ccc",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                opacity: 0.7,
                flexShrink: 0,
                background: "#fafafa",
            }}
        >
            NO IMG
        </div>
    );
}
