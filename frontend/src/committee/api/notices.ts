import { httpStaff } from "../../shared/httpStaff";

export type PublicNotice = {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    publishedAt: string;
    expiresAt: string | null;
    updatedAt: string;
};

export type PublicNoticeUpsertRequest = {
    title: string;
    body: string;
    pinned: boolean;
    publishedAt: string; // ISO
    expiresAt: string | null; // ISO or null
};

export async function fetchCommitteeNotices(
    limit = 200,
): Promise<PublicNotice[]> {
    const res = await httpStaff.get(`/committee/notices`, {
        params: { limit },
    });
    return res.data;
}

export async function createCommitteeNotice(
    req: PublicNoticeUpsertRequest,
): Promise<PublicNotice> {
    const res = await httpStaff.post(`/committee/notices`, req);
    return res.data;
}

export async function deleteCommitteeNotice(id: string): Promise<void> {
    await httpStaff.delete(`/committee/notices/${id}`);
}
