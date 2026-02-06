// frontend/src/voting/api/votes.ts
import { httpUser } from "../../shared/httpUser";

/* ===== types ===== */
export type VoteType = "CANDIDATE" | "NONE_SUPPORT";

export type VoteHistoryItem = {
    voteId: string;
    electionId: string;
    electionTitle: string;

    electionStatus: "ONGOING" | "ENDED" | "UPCOMING" | string;

    // ★ type を追加（超大事）
    type: VoteType;

    // ★ NONE_SUPPORT で null を許容
    candidateId: string | null;
    candidateName: string;
    castedAt: string;
};

export type VoteStartResponse = {
    electionId: string;
    title: string;
    candidates: { candidateId: string; name: string }[];
};

export type VoteConfirmRequest =
    | { electionId: string; type: "CANDIDATE"; candidateId: string }
    | { electionId: string; type: "NONE_SUPPORT"; candidateId?: null };

/* ===== api ===== */
export async function startVoting(
    electionId: string,
): Promise<VoteStartResponse> {
    const res = await httpUser.get<VoteStartResponse>("/voting/start", {
        params: { electionId },
    });
    return res.data;
}

// ★ これ1本で candidate / noneSupport 両対応
export async function confirmVote(
    req: VoteConfirmRequest,
): Promise<VoteHistoryItem> {
    const res = await httpUser.post<VoteHistoryItem>("/voting/confirm", req);
    return res.data;
}

// ★ パスは backend に合わせて /voting/history
export async function fetchVoteHistory(): Promise<VoteHistoryItem[]> {
    const res = await httpUser.get<VoteHistoryItem[]>("/voting/history");
    return res.data;
}
