// frontend/src/elections/model/partyTypes.ts
export type PartyListItem = {
    partyId: string;
    partyKey: string;
    name: string;
    shortName: string;
    color: string;
    description: string;
    ideologyTags: string[];
};

export type PartyDetailResponse = {
    partyId: string;
    partyKey: string;
    name: string;
    shortName: string;
    color: string;
    description: string;
    ideologyTags: string[];
};

export type PartyCandidateItem = {
    candidateId: string;
    electionId: string;
    candidateKey: string;
    name: string;
    age: number | null;
    title: string | null;
    imageUrl: string | null;
};
