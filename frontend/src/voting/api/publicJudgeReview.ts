import { httpPublic } from "../../shared/httpPublic";
import type {
    JudgeReviewConfirmRequest,
    JudgeReviewStartResponse,
} from "./judgeReview";

export async function publicStartJudgeReview(electionId: string) {
    const res = await httpPublic.get<JudgeReviewStartResponse>(
        "/public/judge-review/start",
        { params: { electionId } },
    );
    return res.data;
}

export async function publicConfirmJudgeReview(req: JudgeReviewConfirmRequest) {
    await httpPublic.post("/public/judge-review/confirm", req);
}
