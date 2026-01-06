export type ApiError = { code: string; message: string };

export type TokenResponse = {
    accessToken: string;
    tokenType?: string;
    expiresInSeconds?: number;
    role?: string;
};

export type MeResponse = {
    accountId: string;
    email: string;
    role: string;
    emailVerified: boolean;
    identityLinked: boolean;
};

export type ElectionListItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    canVote: boolean;
    alreadyVoted: boolean;
};

export type CandidateItem = { id: string; name: string };

export type VoteHistoryItem = {
    voteId: string;
    electionId: string;
    electionTitle: string;
    candidateId: string;
    candidateName: string;
    castedAt: string;
};
