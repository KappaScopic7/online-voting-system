// frontend/src/me/ui/FavoriteButton.tsx
import { useMemo } from "react";
import type { FavoriteTargetType } from "../../shared/api/favorites";
import { useFavorite } from "../../shared/hooks/useFavorites";
import { useAuth } from "../../user/UserAuthContext";
import { useLocation, useNavigate } from "react-router-dom";

type Props = {
    targetType: FavoriteTargetType;
    targetId: string;
    className?: string;
    size?: "sm" | "md";
    compact?: boolean; // true: アイコンのみ寄り（狭い場所用）
};

export function FavoriteButton({
    targetType,
    targetId,
    className,
    size = "md",
    compact = false,
}: Props) {
    const { isAuthed } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();

    const { favorited, loading, toggle } = useFavorite(targetType, targetId);

    const label = useMemo(() => {
        if (!isAuthed) return "ログインしてブックマーク";
        return favorited ? "ブックマーク済み" : "ブックマーク";
    }, [isAuthed, favorited]);

    const subLabel = useMemo(() => {
        if (!isAuthed) return "ログインが必要";
        return favorited ? "解除する" : "追加する";
    }, [isAuthed, favorited]);

    const icon = useMemo(() => {
        if (!isAuthed) return "🔒";
        return favorited ? "🔖" : "📑";
    }, [isAuthed, favorited]);

    const pad =
        size === "sm"
            ? { py: 6, px: 10, fs: 12, radius: 999 }
            : { py: 8, px: 12, fs: 13, radius: 999 };

    const tone = !isAuthed ? "locked" : favorited ? "on" : "off";

    const style: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 8 : 10,
        padding: `${pad.py}px ${pad.px}px`,
        borderRadius: pad.radius,
        border:
            tone === "on"
                ? "1px solid #d6e4ff"
                : tone === "locked"
                  ? "1px solid #eee"
                  : "1px solid #e5e5e5",
        background:
            tone === "on" ? "#f4f8ff" : tone === "locked" ? "#fafafa" : "#fff",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.65 : 1,
        userSelect: "none",
        whiteSpace: "nowrap",
        fontSize: pad.fs,
        lineHeight: 1.1,
    };

    return (
        <button
            type="button"
            className={className}
            disabled={loading}
            onClick={async () => {
                // ✅ 未ログイン時：ログイン誘導（戻り先付き）
                if (!isAuthed) {
                    nav("/login", {
                        state: { from: loc.pathname + loc.search },
                    });
                    return;
                }

                try {
                    await toggle();
                } catch (e) {
                    alert(
                        e instanceof Error ? e.message : "操作に失敗しました",
                    );
                }
            }}
            aria-label={label}
            title={
                isAuthed
                    ? favorited
                        ? "ブックマークを解除"
                        : "ブックマークに追加"
                    : "ログインしてブックマーク"
            }
            style={style}
        >
            <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
                {icon}
            </span>

            {/* compact: できるだけ短く */}
            {compact ? (
                <span style={{ fontWeight: 800 }}>
                    {!isAuthed ? "ログイン" : favorited ? "保存済" : "保存"}
                </span>
            ) : (
                <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                    <span style={{ fontWeight: 900 }}>
                        {label}
                        {loading ? "…" : ""}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.75 }}>
                        {subLabel}
                    </span>
                </span>
            )}

            {/* 右側に小さな状態インジケータ */}
            <span
                aria-hidden
                style={{
                    marginLeft: 4,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background:
                        tone === "on"
                            ? "#3b82f6"
                            : tone === "locked"
                              ? "#9ca3af"
                              : "#d1d5db",
                }}
            />
        </button>
    );
}
