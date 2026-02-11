// frontend/src/elections/model/committeeElectionTypes.ts

export type ElectionStatus =
    | "DRAFT"
    | "READY"
    | "OPEN"
    | "CLOSED"
    | "TALLIED"
    | "PUBLISHED"
    | "ARCHIVED";

export type CommitteeElectionListItem = {
    id: string;
    electionKey: string;
    title: string;
    summary: string;

    electionType: string;
    ballotType: string;
    allocationTarget: string;

    districtPrefCode: string;
    districtCityCode: string;
    districtLabel: string;

    startsAt: string; // ISO
    endsAt: string; // ISO

    status: ElectionStatus;
    talliedAt: string | null;
    publishedAt: string | null;
};
