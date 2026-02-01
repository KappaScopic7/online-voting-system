// frontend/src/voting/api/votes.ts
import { httpUser } from "../../shared/httpUser";

/* ===== types ===== */
export type VoteHistoryItem = {
    voteId: string;
    electionId: string;
    electionTitle: string;
    candidateName: string;
    castedAt: string;
    electionStatus: "ONGOING" | "ENDED" | "UPCOMING";
};

export type VoteStartResponse = {
    electionId: string;
    title: string;
    candidates: {
        candidateId: string;
        name: string;
    }[];
};

/* ===== api ===== */
export async function startVoting(
    electionId: string,
): Promise<VoteStartResponse> {
    const res = await httpUser.get<VoteStartResponse>("/api/voting/start", {
        params: { electionId },
    });
    return res.data;
}

export async function confirmVote(
    electionId: string,
    candidateId: string,
): Promise<VoteHistoryItem> {
    const res = await httpUser.post<VoteHistoryItem>("/api/voting/confirm", {
        electionId,
        candidateId,
    });
    return res.data;
}

export async function fetchVoteHistory(): Promise<VoteHistoryItem[]> {
    const res = await httpUser.get<VoteHistoryItem[]>("/api/votes");
    return res.data;
}
