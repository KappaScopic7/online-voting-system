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
    id: string;
    candidateKey: string;
    name: string;
    age: number | null;
    title: string | null;
    sortOrder: number;
    party: {
        partyKey: string;
        shortName: string;
        name: string;
        color?: string | null;
    } | null;
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
