import { httpUser } from "../../shared/httpUser";
import { httpPublic } from "../../shared/httpPublic";

export type LinkIdentityResponse = { accessToken: string };

export async function linkIdentity(params: {
    payload: string;
    pin: string;
}): Promise<LinkIdentityResponse> {
    const res = await httpUser.post<LinkIdentityResponse>(
        "/identity/link",
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

export type VotePairingCompleteRequest = {
    payload: string;
    pin: string;
};

export type VotePairingCompleteResponse = {
    ticket: string;
};

export async function completeVotePairing(
    pairId: string,
    req: VotePairingCompleteRequest,
) {
    const res = await httpPublic.post<VotePairingCompleteResponse>(
        `/public/pairings/${encodeURIComponent(pairId)}/complete`,
        req,
    );
    return res.data;
}
export type LinkPairingCreateResponse = {
    pairId: string;
    expiresAt?: string;
};

export async function createLinkPairing() {
    const res = await httpUser.post<LinkPairingCreateResponse>(
        "/identity/link-pairings",
        {},
    );
    return res.data;
}
