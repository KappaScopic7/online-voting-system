import { httpUser } from "../../shared/httpUser";

export type LinkIdentityResponse = { accessToken: string };

export async function linkIdentity(params: {
    citizenId: string;
    pin?: string; // 現状バックは無視する（後で対応）
}): Promise<LinkIdentityResponse> {
    const res = await httpUser.post<LinkIdentityResponse>(
        "/identity/link", // ✅ baseURL=/api → /api/identity/link
        params,
    );
    return res.data;
}
