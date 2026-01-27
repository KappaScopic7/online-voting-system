// frontend/src/elections/model/candidateTypes.ts
export type PartySummary = {
    partyKey: string;
    name: string;
    shortName: string;
    color: string;
};

export type CandidateDetailResponse = {
    candidateId: string;
    electionId: string;

    candidateKey: string;
    name: string;
    age: number | null;

    party: PartySummary | null;

    title: string;
    bio: string;
    policies: string[];

    websiteUrl: string | null;
    imageUrl: string | null;

    sortOrder: number;
};
