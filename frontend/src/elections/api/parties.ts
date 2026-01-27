// frontend/src/elections/api/parties.ts
import axios from "axios";
import type { PartyDetailResponse, PartyListItem } from "../model/partyTypes";

export async function fetchParties(): Promise<PartyListItem[]> {
    const res = await axios.get("/api/parties");
    return res.data;
}

export async function fetchPartyDetail(
    partyKey: string,
): Promise<PartyDetailResponse> {
    const res = await axios.get(`/api/parties/${encodeURIComponent(partyKey)}`);
    return res.data;
}
