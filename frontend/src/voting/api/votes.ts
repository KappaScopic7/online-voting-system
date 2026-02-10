import { httpUser } from "../../shared/httpUser";

/* ===== types ===== */
export type VoteType = "CANDIDATE" | "NONE_SUPPORT" | "JUDGE_REVIEW";

export type VoteHistoryItem = {
    voteId: string;
    electionId: string;
    electionTitle: string;

    electionStatus: "ONGOING" | "ENDED" | "UPCOMING" | string;

    // 統合DTO
    type: VoteType;

    // 旧candidateId/candidateNameをやめる
    targetId: string | null; // CANDIDATE/JUDGE_REVIEW のID、NONE_SUPPORT は null
    label: string; // 候補者名/裁判官名/"誰も支持しない"

    // JUDGE_REVIEW のみ: OK=true / NO=false
    approve: boolean | null;

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

// candidate / noneSupport のみ（judge review は別API）
export async function confirmVote(
    req: VoteConfirmRequest,
): Promise<VoteHistoryItem> {
    const res = await httpUser.post<VoteHistoryItem>("/voting/confirm", req);
    return res.data;
}

export async function fetchVoteHistory(): Promise<VoteHistoryItem[]> {
    const res = await httpUser.get<VoteHistoryItem[]>("/voting/history");
    return res.data;
}
