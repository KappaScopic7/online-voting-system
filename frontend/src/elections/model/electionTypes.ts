export type ElectionStatus = "UPCOMING" | "ONGOING" | "ENDED" | string;

export type ElectionCandidateSummary = {
    id: string;
    name: string;
};

export type ElectionListItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: ElectionStatus;
    hasResult: boolean;
    candidateCount: number;
    canCast: boolean;
    currentVote: null | {
        candidateId: string;
        candidateName: string | null;
        castedAt: string;
    };
};

export type ElectionResultResponse = {
    electionId: string;
    title: string;
    tallyType: string;
    totalVotes: number;
    talliedAt: string;
    results: {
        candidateId: string;
        candidateName: string;
        votes: number;
    }[];
};

export type ElectionDetailResponse = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: ElectionStatus;
    candidateCount: number;
    candidates: ElectionCandidateSummary[];
    canCast: boolean;
    currentVote: null | {
        candidateId: string;
        candidateName: string | null;
        castedAt: string;
    };
};
