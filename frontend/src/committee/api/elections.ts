// frontend/src/committee/api/elections.ts
import { createHttpClient } from "../../shared/httpClientFactory";
import { staffToken } from "../../shared/tokenStorage";

export type CommitteeElectionListItem = {
    electionId: string;
    title: string;
    status: "UPCOMING" | "ONGOING" | "ENDED";
    startsAt?: string | null;
    endsAt?: string | null;
};

const httpStaff = createHttpClient(staffToken);

// ※ パスは仮。あなたのbackendに合わせて変えてOK
export async function fetchCommitteeElections(): Promise<
    CommitteeElectionListItem[]
> {
    const res = await httpStaff.get<CommitteeElectionListItem[]>(
        "/api/committee/elections",
    );
    return res.data;
}
