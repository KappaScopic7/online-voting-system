import { httpPublic } from "../../shared/httpPublic";
import type {
    AllocVoteStartResponse,
    AllocVoteConfirmRequest,
    AllocVoteHistoryItem,
} from "../model/allocVotingTypes";

export async function publicAllocStart(electionId: string) {
    const res = await httpPublic.get<AllocVoteStartResponse>(
        "/public/alloc-voting/start",
        { params: { electionId } },
    );
    return res.data;
}

export async function publicAllocConfirm(req: AllocVoteConfirmRequest) {
    const res = await httpPublic.post<AllocVoteHistoryItem>(
        "/public/alloc-voting/confirm",
        req,
    );
    return res.data;
}
