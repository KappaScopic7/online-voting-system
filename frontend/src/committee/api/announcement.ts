import { httpStaff } from "../../shared/httpStaff";
import type { SystemAnnouncement } from "../../shared/model/announcement";

export async function fetchCommitteeAnnouncement(): Promise<SystemAnnouncement> {
    const res = await httpStaff.get<SystemAnnouncement>(
        "/committee/announcement",
    );
    return res.data;
}

export async function updateCommitteeAnnouncement(input: {
    enabled: boolean;
    actor: SystemAnnouncement["actor"];
    message: string;
}): Promise<SystemAnnouncement> {
    const res = await httpStaff.put<SystemAnnouncement>(
        "/committee/announcement",
        input,
    );
    return res.data;
}
