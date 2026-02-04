// frontend/src/elections/api/parties.ts
import { httpUser } from "../../shared/httpUser";
import type {
    PartyCandidateItem,
    PartyDetailResponse,
    PartyListItem,
} from "../model/partyTypes";

export async function fetchParties(): Promise<PartyListItem[]> {
    const res = await httpUser.get("/parties");
    return res.data;
}

export async function fetchPartyDetail(
    partyKey: string,
): Promise<PartyDetailResponse> {
    const res = await httpUser.get(`/parties/${encodeURIComponent(partyKey)}`);
    return res.data;
}

export async function fetchPartyCandidates(
    partyKey: string,
): Promise<PartyCandidateItem[]> {
    const res = await httpUser.get(
        `/parties/${encodeURIComponent(partyKey)}/candidates`,
    );
    return res.data;
}
