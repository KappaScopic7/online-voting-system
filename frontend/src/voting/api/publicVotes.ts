// frontend/src/voting/api/publicVotes.ts
import { httpPublic } from "../../shared/httpPublic";
import type {
    VoteConfirmRequest,
    VoteHistoryItem,
    VoteStartResponse,
} from "./votes";

export async function publicStartVoting(
    electionId: string,
): Promise<VoteStartResponse> {
    const res = await httpPublic.get<VoteStartResponse>(
        "/public/voting/start",
        {
            params: { electionId },
        },
    );
    return res.data;
}

export async function publicConfirmVote(
    req: VoteConfirmRequest,
): Promise<VoteHistoryItem> {
    const res = await httpPublic.post<VoteHistoryItem>(
        "/public/voting/confirm",
        req,
    );
    return res.data;
}
