export type AllocVoteStartResponse = {
    electionId: string;
    electionTitle: string;
    pointsPerVoter: number; // 100
    options: {
        type: "CANDIDATE" | "NONE_SUPPORT";
        candidateId: string | null;
        label: string;
    }[];
};

export type AllocVoteConfirmRequest = {
    electionId: string;
    pointsTotal: number; // 100
    items: {
        type: "CANDIDATE" | "NONE_SUPPORT";
        candidateId: string | null;
        points: number;
    }[];
};

export type AllocVoteHistoryItem = {
    castId: string;
    electionId: string;
    electionTitle: string;
    electionStatus: "UPCOMING" | "ONGOING" | "ENDED" | "UNKNOWN";
    pointsTotal: number;
    castedAt: string;
    items: {
        type: "CANDIDATE" | "NONE_SUPPORT";
        candidateId: string | null;
        label: string;
        points: number;
    }[];
};
