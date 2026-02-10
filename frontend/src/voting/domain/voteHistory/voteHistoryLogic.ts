import type { VoteHistoryItem } from "../../api/votes";

export function normalSectionTitle(normal: VoteHistoryItem[]) {
    const hasCandidateVotes = normal.some((v) => v.type !== "JUDGE_REVIEW");
    const hasJudgeReview = normal.some((v) => v.type === "JUDGE_REVIEW");
    return hasCandidateVotes && hasJudgeReview
        ? "通常投票 / 国民審査"
        : hasJudgeReview
          ? "国民審査"
          : "通常投票";
}

export function isJudgeReviewOnly(normal: VoteHistoryItem[]) {
    return normal.length > 0 && normal.every((v) => v.type === "JUDGE_REVIEW");
}

export function normalChangeLink(electionId: string, judgeOnly: boolean) {
    return judgeOnly
        ? `/judge-review/start?electionId=${encodeURIComponent(electionId)}`
        : `/voting/entry?electionId=${encodeURIComponent(electionId)}`;
}
