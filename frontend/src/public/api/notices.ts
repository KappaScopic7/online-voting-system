import { httpPublic } from "../../shared/httpPublic";

export type PublicNotice = {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    publishedAt: string;
    expiresAt: string | null;
    updatedAt: string;
};

export async function fetchPublicNotices(limit = 5) {
    const r = await httpPublic.get(`/public/notices`, {
        params: { limit },
    });
    return r.data;
}
