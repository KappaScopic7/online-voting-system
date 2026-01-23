// api/elections.ts
import { httpUser } from "../../shared/httpUser";

/* ===== types ===== */
export type ElectionListItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: "UPCOMING" | "ONGOING" | "ENDED" | string;
    hasResult: boolean;
    candidateCount: number;
    canCast: boolean;
    currentVote: null | {
        candidateId: string;
        candidateName: string | null;
        castedAt: string;
    };
};

export type CandidateItem = {
    candidateId: string;
    name: string;
};

export type ElectionResultResponse = {
    electionId: string;
    title: string;
    tallyType: string;
    totalVotes: number;
    talliedAt: string;
    results: {
        candidateId: string;
        candidateName: string;
        votes: number;
    }[];
};

/* ===== api ===== */
export async function fetchElections(): Promise<ElectionListItem[]> {
    const res = await httpUser.get<ElectionListItem[]>("/api/elections");
    return res.data;
}

export async function fetchCandidates(
    electionId: string,
): Promise<CandidateItem[]> {
    const res = await httpUser.get<CandidateItem[]>(
        `/api/elections/${electionId}/candidates`,
    );
    return res.data;
}

export async function fetchResult(
    electionId: string,
): Promise<ElectionResultResponse> {
    const res = await httpUser.get<ElectionResultResponse>(
        `/api/elections/${electionId}/result`,
    );
    return res.data;
}
