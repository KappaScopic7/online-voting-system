// frontend/src/elections/api/candidates.ts
import axios from "axios";
import type { CandidateDetailResponse } from "../model/candidateTypes";

export async function fetchCandidateDetail(
    electionId: string,
    candidateId: string,
): Promise<CandidateDetailResponse> {
    const res = await axios.get(
        `/api/elections/${encodeURIComponent(electionId)}/candidates/${encodeURIComponent(candidateId)}`,
    );
    return res.data;
}
