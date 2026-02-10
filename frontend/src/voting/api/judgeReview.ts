import { httpUser } from "../../shared/httpUser";

export type JudgeReviewChoice = "OK" | "NO";

export type JudgeReviewStartResponse = {
    electionId: string;
    electionTitle: string;
    judges: { candidateId: string; name: string; title: string }[];
    current: Record<string, JudgeReviewChoice> | null; // judgeCandidateId -> "OK"/"NO"
};

export type JudgeReviewConfirmRequest = {
    electionId: string;
    choices: { judgeCandidateId: string; choice: JudgeReviewChoice }[];
};

export async function startJudgeReview(electionId: string) {
    const res = await httpUser.get<JudgeReviewStartResponse>(
        "/judge-review/start",
        { params: { electionId } },
    );
    return res.data;
}

export async function confirmJudgeReview(req: JudgeReviewConfirmRequest) {
    await httpUser.post("/judge-review/confirm", req);
}
