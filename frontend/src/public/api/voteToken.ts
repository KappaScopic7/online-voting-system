// frontend/src/public/api/voteToken.ts
import { httpPublic } from "../../shared/httpPublic";

export type VoteTokenIssueRequest = {
    electionId: string;
    payload: string; // NFCから取れたUUID文字列でOK
    pin: string; // 4桁
};

export type VoteTokenIssueResponse = {
    voteToken: string;
};

export async function issueVoteToken(req: VoteTokenIssueRequest) {
    const res = await httpPublic.post<VoteTokenIssueResponse>(
        "/public/vote-token/issue",
        req,
    );
    return res.data;
}
