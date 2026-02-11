// frontend/src/elections/api/committeeElections.ts
import { httpStaff } from "../../shared/httpStaff";
import type { CommitteeElectionListItem } from "../model/committeeElectionTypes";

export async function listCommitteeElections(): Promise<
    CommitteeElectionListItem[]
> {
    const res = await httpStaff.get<CommitteeElectionListItem[]>(
        "/committee/elections",
    );
    return res.data;
}

export async function actionReady(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/ready`,
        {},
    );
    return res.data;
}
export async function actionStart(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/start`,
        {},
    );
    return res.data;
}
export async function actionClose(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/close`,
        {},
    );
    return res.data;
}
export async function actionTally(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/tally`,
        {},
    );
    return res.data;
}
export async function actionPublish(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/publish`,
        {},
    );
    return res.data;
}
export async function actionUnpublish(electionId: string) {
    const res = await httpStaff.post(
        `/committee/elections/${electionId}/actions/unpublish`,
        {},
    );
    return res.data;
}
export async function actionSetStatus(electionId: string, status: string) {
    await httpStaff.post(`/committee/elections/${electionId}/status`, {
        status,
    });
}

export async function actionGenerateChart(electionId: string) {
    await httpStaff.post(
        `/committee/elections/${electionId}/chart:generate`,
        {},
    );
}
