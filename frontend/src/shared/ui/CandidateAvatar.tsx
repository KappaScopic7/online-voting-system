// frontend/src/shared/ui/CandidateAvatar.tsx

import { useState } from "react";

type Props = {
    name: string;
    imageUrl?: string | null; // APIから来る可能性
    index?: number; // 並び順でassetsに落とす用
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

export function CandidateAvatar({ name, imageUrl, index, size = 48 }: Props) {
    const [src, setSrc] = useState<string | null>(
        imageUrl?.startsWith("http")
            ? imageUrl
            : imageUrl
              ? assetUrl(imageUrl)
              : fallbackByIndex(index),
    );

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
            }}
            onError={() => {
                // API画像が死んでたらassetsに切り替え、それも死んでたらNO IMG
                const fb = fallbackByIndex(index);
                setSrc((prev) => (prev !== fb ? fb : null));
            }}
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
            }}
        >
            NO IMG
        </div>
    );
}
