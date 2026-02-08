// frontend/src/me/ui/FavoriteButton.tsx
import type { FavoriteTargetType } from "../../shared/api/favorites";
import { useFavorite } from "../../shared/hooks/useFavorites";
import { useAuth } from "../../user/UserAuthContext";
import { useLocation, useNavigate } from "react-router-dom";

type Props = {
    targetType: FavoriteTargetType;
    targetId: string;
    className?: string;
};

export function FavoriteButton({ targetType, targetId, className }: Props) {
    const { isAuthed } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();

    const { favorited, loading, toggle } = useFavorite(targetType, targetId);

    const label = favorited ? "ブックマーク解除" : "ブックマークに追加";

    return (
        <button
            type="button"
            className={className}
            disabled={loading}
            onClick={async () => {
                // ✅ 未ログイン時：ログイン誘導（戻り先付き）
                if (!isAuthed) {
                    alert("ブックマークにはログインが必要です");
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
            title={label}
            style={{
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontSize: 18,
                lineHeight: 1,
                border: "none",
                background: "transparent",
            }}
        >
            {/* 🔖：ブックマーク済み/未を見分けたいならCSSやSVGに差し替え推奨 */}
            {favorited ? "🔖" : "📑"}
        </button>
    );
}
