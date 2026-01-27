// frontend/src/elections/model/partyTypes.ts
export type PartyListItem = {
    partyId: string;
    partyKey: string;
    name: string;
    shortName: string;
    color: string;
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
