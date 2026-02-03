// frontend/src/elections/api/elections.ts
import { httpUser } from "../../shared/httpUser";
import type {
    ElectionListItem,
    ElectionResultResponse,
    ElectionDetailResponse,
} from "../model/electionTypes";
import type { AllocElectionResultResponse } from "../model/electionTypes";

export async function fetchElections(): Promise<ElectionListItem[]> {
    const res = await httpUser.get<ElectionListItem[]>("/api/elections");
    return res.data;
}

export async function fetchResult(
    electionId: string,
): Promise<ElectionResultResponse> {
    const res = await httpUser.get<ElectionResultResponse>(
        `/api/elections/${encodeURIComponent(electionId)}/result`,
    );
    return res.data;
}

export async function fetchElectionDetail(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpUser.get<ElectionDetailResponse>(
        `/api/elections/${encodeURIComponent(electionId)}`,
    );
    return res.data;
}

export async function fetchAllocResult(electionId: string) {
    const res = await httpUser.get<AllocElectionResultResponse>(
        `/api/elections/${electionId}/alloc-result`,
    );
    return res.data;
}
