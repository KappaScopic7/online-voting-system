import { http } from "../../shared/http";

export type MyElectionItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
};

export async function fetchMyElections(): Promise<MyElectionItem[]> {
    return http.get("/api/me/elections").then((res) => res.data);
}
