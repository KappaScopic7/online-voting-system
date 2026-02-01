// frontend/src/candidates/model/candidateTypes.ts

export type PartySummary = {
    partyKey: string;
    shortName: string;
    name: string;
    color: string;
    description: string;
    ideologyTags: string[];
};

export type CandidateDetailResponse = {
    candidateId: string;
    electionId: string;

    candidateKey: string;
    name: string;
    age: number | null;

    title: string;
    bio: string;
    policies: string[];

    websiteUrl: string | null;
    imageUrl: string | null;

    party: PartySummary | null;
};

export type CandidateItem = {
    id: string;
    electionId: string;
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
