// frontend/src/parties/model/partyTypes.ts
export type PartyListItem = {
    partyKey: string;
    name: string;
    shortName: string;
    color: string; // "#RRGGBB"
};

export type PartyDetailResponse = {
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
    title: string;
    imageUrl: string | null;
};
