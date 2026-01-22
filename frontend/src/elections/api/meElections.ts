import { apiFetch } from "../../shared/apiFetch";

export type MyElectionItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
};

export async function fetchMyElections(): Promise<MyElectionItem[]> {
    return apiFetch("/api/me/elections");
}
