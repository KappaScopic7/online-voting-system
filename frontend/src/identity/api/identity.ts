import { httpUser } from "../../shared/httpUser";
import { httpPublic } from "../../shared/httpPublic";

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
export type VotePairingCreateRequest = {
    electionId: string;
};

export type VotePairingCreateResponse = {
    pairId: string;
    expiresAt?: string; // あれば
};

export type VotePairingGetResponse = {
    pairId: string;
    status: "PENDING" | "COMPLETED" | "EXPIRED" | string;
    ticket?: string | null;
};

export async function createVotePairing(req: VotePairingCreateRequest) {
    const res = await httpPublic.post<VotePairingCreateResponse>(
        "/public/pairings",
        req,
    );
    return res.data;
}

export async function getVotePairing(pairId: string) {
    const res = await httpPublic.get<VotePairingGetResponse>(
        `/public/pairings/${encodeURIComponent(pairId)}`,
    );
    return res.data;
}
