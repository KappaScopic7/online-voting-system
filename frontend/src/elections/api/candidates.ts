// frontend/src/elections/api/candidates.ts
import { httpUser } from "../../shared/httpUser";
import type { CandidateDetailResponse } from "../model/candidateTypes";

export async function fetchCandidateDetail(
    electionId: string,
    candidateId: string,
): Promise<CandidateDetailResponse> {
    const res = await httpUser.get(
        `/api/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    );
    return res.data;
}
