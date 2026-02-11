// frontend/src/elections/api/meElections.ts
import { httpUser } from "../../shared/httpUser";
import type { ElectionListItem } from "../model/electionTypes";

export async function fetchMyElections(): Promise<ElectionListItem[]> {
    const res = await httpUser.get<ElectionListItem[]>("/me/elections");
    return res.data;
}
