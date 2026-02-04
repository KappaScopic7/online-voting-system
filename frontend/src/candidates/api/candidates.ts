// frontend/src/candidates/api/candidates.ts
import { httpUser } from "../../shared/httpUser";
import type {
    CandidateDetailResponse,
    CandidateItem,
} from "../model/candidateTypes";

export type FetchCandidatesParams = {
    electionId?: string;
    partyKey?: string;
};

export async function fetchCandidates(
    params?: FetchCandidatesParams,
): Promise<CandidateItem[]> {
    const res = await httpUser.get<CandidateItem[]>("/candidates", {
        params: params ?? {},
    });
    return res.data;
}

export async function fetchCandidateDetail(
    electionId: string,
    candidateId: string,
): Promise<CandidateDetailResponse> {
    const res = await httpUser.get<CandidateDetailResponse>(
        `/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    );
    return res.data;
}

export async function fetchCandidateDetailById(
    candidateId: string,
): Promise<CandidateDetailResponse> {
    const res = await httpUser.get<CandidateDetailResponse>(
        `/candidates/${encodeURIComponent(candidateId)}`,
    );
    return res.data;
}

export async function fetchElectionCandidates(
    electionId: string,
): Promise<CandidateItem[]> {
    const res = await httpUser.get<CandidateItem[]>(
        `/elections/${encodeURIComponent(electionId)}/candidates`,
    );
    return res.data;
}
