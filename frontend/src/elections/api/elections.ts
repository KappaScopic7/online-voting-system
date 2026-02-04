import { httpUser } from "../../shared/httpUser";
import type {
    ElectionListItem,
    ElectionDetailResponse,
    ElectionResultBundleResponse,
} from "../model/electionTypes";

export async function fetchElections(): Promise<ElectionListItem[]> {
    const res = await httpUser.get<ElectionListItem[]>("/elections");
    return res.data;
}

export async function fetchElectionDetail(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpUser.get<ElectionDetailResponse>(
        `/elections/${encodeURIComponent(electionId)}`,
    );
    return res.data;
}

export async function fetchResultBundle(electionId: string) {
    const res = await httpUser.get<ElectionResultBundleResponse>(
        `/elections/${encodeURIComponent(electionId)}/result`,
    );
    return res.data;
}
