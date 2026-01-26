// frontend/src/elections/api/elections.ts
import { httpUser } from "../../shared/httpUser";
import type {
    ElectionListItem,
    CandidateItem,
    ElectionResultResponse,
    ElectionDetailResponse,
} from "../model/electionTypes";

export async function fetchElections(): Promise<ElectionListItem[]> {
    const res = await httpUser.get<ElectionListItem[]>("/api/elections");
    return res.data;
}

export async function fetchCandidates(electionId: string): Promise<CandidateItem[]> {
    const res = await httpUser.get<CandidateItem[]>(
        `/api/elections/${electionId}/candidates`,
    );
    return res.data;
}

export async function fetchResult(electionId: string): Promise<ElectionResultResponse> {
    const res = await httpUser.get<ElectionResultResponse>(
        `/api/elections/${electionId}/result`,
    );
    return res.data;
}

// 追加（詳細）
export async function fetchElectionDetail(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpUser.get<ElectionDetailResponse>(
        `/api/elections/${electionId}`,
    );
    return res.data;
}
