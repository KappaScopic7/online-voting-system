// frontend/src/voting/model/allocVotingTypes.ts

export type AllocTargetType = "CANDIDATE" | "PARTY" | "NONE_SUPPORT";

export type AllocVoteStartResponse = {
    electionId: string;
    electionTitle: string;
    pointsPerVoter: number; // 100
    options: {
        type: AllocTargetType;
        targetId: string | null; // NONE_SUPPORT は null
        label: string;
    }[];
};

export type AllocVoteConfirmRequest = {
    electionId: string;
    pointsTotal: number; // 100
    items: {
        type: AllocTargetType;
        targetId: string | null; // NONE_SUPPORT は null
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
        type: AllocTargetType;
        targetId: string | null; // NONE_SUPPORT は null
        label: string;
        points: number;
    }[];
};
