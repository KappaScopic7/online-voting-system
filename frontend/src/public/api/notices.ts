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

export async function fetchPublicNotices(limit = 5): Promise<PublicNotice[]> {
    const res = await httpPublic.get(`/notices`, { params: { limit } });
    return res.data;
}
