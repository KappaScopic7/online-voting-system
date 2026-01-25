// frontend/src/elections/api/meElections.ts
import { httpUser } from "../../shared/httpUser";

export type MyElectionItem = {
    electionId: string;
    title: string;
    startsAt: string;
    endsAt: string;
};

export async function fetchMyElections(): Promise<MyElectionItem[]> {
    return httpUser.get("/api/me/elections").then((res) => res.data);
}
