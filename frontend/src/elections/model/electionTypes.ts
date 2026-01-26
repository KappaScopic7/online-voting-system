// frontend/src/elections/model/electionsTypes.ts
export type ElectionStatus = "UPCOMING" | "ONGOING" | "ENDED" | string;

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

export type CandidateItem = {
    candidateId: string;
    name: string;
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
    candidates: {
        id: string;
        name: string;
    }[];
    canCast: boolean;
    currentVote: null | {
        candidateId: string;
        candidateName: string | null;
        castedAt: string;
    };
};
