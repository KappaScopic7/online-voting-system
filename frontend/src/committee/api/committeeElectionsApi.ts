// frontend/src/committee/api/committeeElectionsApi.ts
import { createHttpClient } from "../../shared/httpClientFactory";
import { staffToken } from "../../shared/tokenStorage";
import type { ElectionDetailResponse } from "../../elections/model/electionTypes";

const httpStaff = createHttpClient(staffToken);

// ※ createHttpClient が "/api" を prefix 済みの想定（あなたの elections.ts と合わせる）
export async function committeeMarkReady(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/ready`,
    );
    return res.data;
}

export async function committeeStart(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/start`,
    );
    return res.data;
}

export async function committeeClose(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/close`,
    );
    return res.data;
}

export async function committeeTally(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/tally`,
    );
    return res.data;
}

export async function committeePublish(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/publish`,
    );
    return res.data;
}

export async function committeeUnpublish(
    electionId: string,
): Promise<ElectionDetailResponse> {
    const res = await httpStaff.post<ElectionDetailResponse>(
        `/committee/elections/${electionId}/actions/unpublish`,
    );
    return res.data;
}
