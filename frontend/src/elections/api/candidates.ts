// frontend/src/elections/api/candidates.ts
import { httpUser } from "../../shared/httpUser";
import type { CandidateDetailResponse } from "../model/candidateTypes";
import type { CandidateItem } from "../model/electionTypes";

export type FetchCandidatesParams = {
    electionId?: string;
    partyKey?: string;
};

export async function fetchCandidates(params?: FetchCandidatesParams) {
    const res = await httpUser.get<CandidateItem[]>("/api/candidates", {
        params: params ?? {},
    });
    return res.data;
}

export async function fetchCandidateDetail(
    electionId: string,
    candidateId: string,
): Promise<CandidateDetailResponse> {
    const res = await httpUser.get(
        `/api/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    );
    return res.data;
}
