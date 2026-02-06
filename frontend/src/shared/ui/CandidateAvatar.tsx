// frontend/src/shared/ui/CandidateAvatar.tsx

type Mode = "AUTO" | "EMPTY" | "SILHOUETTE";

export function CandidateAvatar({
    name,
    imageUrl,
    index = 0,
    size = 36,
    mode = "AUTO",
}: {
    name: string;
    imageUrl?: string | null;
    index?: number;
    size?: number;
    mode?: Mode;
}) {
    const px = Math.max(16, Math.floor(size));

    // 1) 明示的に無表示
    if (mode === "EMPTY") {
        return (
            <div
                aria-hidden
                style={{
                    width: px,
                    height: px,
                    borderRadius: 999,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    flexShrink: 0,
                }}
            />
        );
    }

    // 2) 人影アイコン
    if (mode === "SILHOUETTE") {
        return (
            <div
                aria-hidden
                style={{
                    width: px,
                    height: px,
                    borderRadius: 999,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <svg
                    width={Math.floor(px * 0.62)}
                    height={Math.floor(px * 0.62)}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z"
                        stroke="currentColor"
                        opacity="0.55"
                        strokeWidth="1.6"
                    />
                    <path
                        d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8"
                        stroke="currentColor"
                        opacity="0.55"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        );
    }

    // 3) AUTO（従来互換）
    //    imageUrl があればそれ優先。
    //    imageUrl が無ければ index からローカル画像を使う。
    const src =
        imageUrl && imageUrl.trim().length > 0
            ? imageUrl
            : `/assets/candidates/candidate-${String(index + 1).padStart(3, "0")}.png`;

    return (
        <img
            alt={name}
            width={px}
            height={px}
            src={src}
            style={{
                width: px,
                height: px,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid #eee",
                flexShrink: 0,
                background: "#fafafa",
            }}
        />
    );
}
