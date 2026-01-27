// frontend/src/parties/api/parties.ts
import axios from "axios";
import type {
    PartyCandidateItem,
    PartyDetailResponse,
    PartyListItem,
} from "../model/partyTypes";

export async function fetchParties(): Promise<PartyListItem[]> {
    const res = await axios.get("/api/parties");
    return res.data;
}

export async function fetchParty(
    partyKey: string,
): Promise<PartyDetailResponse> {
    const res = await axios.get(`/api/parties/${encodeURIComponent(partyKey)}`);
    return res.data;
}

export async function fetchPartyCandidates(
    partyKey: string,
): Promise<PartyCandidateItem[]> {
    const res = await axios.get(
        `/api/parties/${encodeURIComponent(partyKey)}/candidates`,
    );
    return res.data;
}
