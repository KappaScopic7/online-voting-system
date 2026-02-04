// frontend/src/elections/api/meElections.ts
import { httpUser } from "../../shared/httpUser";

export type MyElectionItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: "UPCOMING" | "ONGOING" | "ENDED";
    hasResult: boolean;
    canCast: boolean;
    currentVote?: {
        candidateId: string;
        candidateName?: string;
        castedAt?: string;
    } | null;
};

export async function fetchMyElections(): Promise<MyElectionItem[]> {
    const res = await httpUser.get<MyElectionItem[]>("/me/elections");
    return res.data;
}
