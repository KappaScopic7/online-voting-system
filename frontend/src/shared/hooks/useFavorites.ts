// frontend/src/shared/hooks/useFavorites.ts
import { useCallback, useEffect, useState } from "react";
import {
    addFavorite,
    getFavoriteState,
    removeFavorite,
} from "../api/favorites";
import type { FavoriteTargetType } from "../api/favorites";

export function useFavorite(targetType: FavoriteTargetType, targetId: string) {
    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const s = await getFavoriteState(targetType, targetId);
                if (!cancelled) setFavorited(!!s.favorited);
            } catch {
                // state取得失敗時はとりあえずOFF扱い（必要ならErrorCard表示にしてもOK）
                if (!cancelled) setFavorited(false);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [targetType, targetId]);

    const toggle = useCallback(async () => {
        const next = !favorited;
        setFavorited(next); // 楽観更新
        try {
            if (next) await addFavorite(targetType, targetId);
            else await removeFavorite(targetType, targetId);
        } catch (e) {
            setFavorited(!next);
            throw e;
        }
    }, [favorited, targetType, targetId]);

    return { favorited, loading, toggle };
}
