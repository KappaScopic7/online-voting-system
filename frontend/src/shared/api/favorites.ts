// frontend/src/shared/api/favorites.ts
import { httpUser } from "../httpUser";
import axios from "axios";

export type FavoriteTargetType = "ELECTION" | "CANDIDATE" | "PARTY";

export type FavoriteStateResponse = { favorited: boolean };

export type ResolvedFavoritesResponse = {
    items: Array<{
        targetType: FavoriteTargetType;
        targetId: string;
        createdAt: string;
        label: string;
        election: null | {
            id: string;
            electionKey: string;
            title: string;
            districtLabel: string;
            startsAt: string;
            endsAt: string;
        };
        candidate: null | {
            id: string;
            electionId: string;
            candidateKey: string;
            name: string;
            age: number | null;
            title: string;
            partyKey: string | null;
            sortOrder: number;
        };
        party: null | {
            id: string;
            partyKey: string;
            name: string;
            shortName: string;
            color: string;
        };
    }>;
};

function normalizeApiError(err: unknown): Error {
    if (axios.isAxiosError(err)) {
        const msg =
            (err.response?.data as any)?.message ??
            (err.response?.data as any)?.error ??
            err.message;
        return new Error(msg || "通信に失敗しました");
    }
    return err instanceof Error ? err : new Error("通信に失敗しました");
}

export async function getFavoriteState(
    targetType: FavoriteTargetType,
    targetId: string,
): Promise<FavoriteStateResponse> {
    try {
        const res = await httpUser.get<FavoriteStateResponse>(
            `/favorites/state`,
            {
                params: { targetType, targetId },
            },
        );
        return res.data;
    } catch (e) {
        throw normalizeApiError(e);
    }
}

export async function addFavorite(
    targetType: FavoriteTargetType,
    targetId: string,
): Promise<void> {
    try {
        await httpUser.post(`/favorites`, { targetType, targetId });
    } catch (e) {
        throw normalizeApiError(e);
    }
}

export async function removeFavorite(
    targetType: FavoriteTargetType,
    targetId: string,
): Promise<void> {
    try {
        await httpUser.delete(`/favorites`, {
            params: { targetType, targetId },
        });
    } catch (e) {
        throw normalizeApiError(e);
    }
}

export async function getResolvedFavorites(): Promise<ResolvedFavoritesResponse> {
    try {
        const res =
            await httpUser.get<ResolvedFavoritesResponse>(
                `/favorites/resolved`,
            );
        return res.data;
    } catch (e) {
        throw normalizeApiError(e);
    }
}
