import { httpUser } from "../../shared/httpUser";
import type {
    AllocVoteStartResponse,
    AllocVoteConfirmRequest,
    AllocVoteHistoryItem,
} from "../model/allocVotingTypes";

export async function allocStart(electionId: string) {
    const res = await httpUser.get<AllocVoteStartResponse>(
        "/api/alloc-voting/start",
        {
            params: { electionId },
        },
    );
    return res.data;
}

export async function allocConfirm(req: AllocVoteConfirmRequest) {
    const res = await httpUser.post<AllocVoteHistoryItem>(
        "/api/alloc-voting/confirm",
        req,
    );
    return res.data;
}

export async function allocHistory() {
    const res = await httpUser.get<AllocVoteHistoryItem[]>(
        "/api/alloc-voting/history",
    );
    return res.data;
}
