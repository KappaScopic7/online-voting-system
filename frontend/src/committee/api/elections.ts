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

export type CommitteeElectionDetail = {
    electionId: string;
    title: string;
    status: "UPCOMING" | "ONGOING" | "ENDED";
    startsAt: string;
    endsAt: string;
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

/**
 * 選挙を新規作成する（委員会用）
 */
export async function createCommitteeElection(input: {
    title: string;
    startsAt: string;
    endsAt: string;
}) {
    const payload = {
        title: input.title,
        startsAt: new Date(input.startsAt).toISOString(),
        endsAt: new Date(input.endsAt).toISOString(),
    };

    const res = await httpStaff.post("/api/committee/elections", payload);
    return res.data;
}
