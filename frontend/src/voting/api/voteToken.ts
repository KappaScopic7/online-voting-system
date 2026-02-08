import { httpPublic } from "../../shared/httpPublic";

export type VoteTokenIssueRequest = {
    electionId: string;
    payload: string; // NFC payload
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
