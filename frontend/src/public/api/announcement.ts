import { httpAnon } from "../../shared/httpAnon";
import type { SystemAnnouncement } from "../../shared/model/announcement";

export async function fetchPublicAnnouncement(): Promise<SystemAnnouncement | null> {
    const res = await httpAnon.get<SystemAnnouncement | null>(
        "/public/announcement",
    );
    return res.data;
}
