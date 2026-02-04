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
    countingMethod: string; // "CURRENT"
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

export type AllocElectionResultResponse = {
    electionId: string;
    title: string;
    countingMethod: string; // "CURRENT"
    totalPoints: number;
    noneSupportPoints: number;
    talliedAt: string;
    results: {
        candidateId: string;
        candidateName: string;
        points: number;
    }[];
};

export type BallotType = "SINGLE_CHOICE" | "ALLOCATION" | string;

export type ElectionResultBundleResponse = {
    electionId: string;
    ballotType: "SINGLE_CHOICE" | "ALLOCATION" | string;
    normal: ElectionResultResponse | null;
    alloc: AllocElectionResultResponse | null;
};
