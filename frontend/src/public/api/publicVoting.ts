import { httpPublic } from "../../shared/httpPublic";

export type VoteStartResponse = {
    electionId: string;
    title: string;
    candidates: { candidateId: string; name: string }[];
};

export type VoteHistoryItem = {
    voteId: string;
    electionId: string;
    electionTitle: string;
    electionStatus: string;
    candidateId: string;
    candidateName: string;
    castedAt: string;
};

export async function publicVoteStart(
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

export async function publicVoteConfirm(
    electionId: string,
    candidateId: string,
): Promise<VoteHistoryItem> {
    const res = await httpPublic.post<VoteHistoryItem>(
        "/public/voting/confirm",
        {
            electionId,
            candidateId,
        },
    );
    return res.data;
}
