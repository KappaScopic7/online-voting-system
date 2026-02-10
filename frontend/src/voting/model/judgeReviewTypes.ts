export type JudgeReviewChoice = "OK" | "NO";

export type JudgeReviewStartResponse = {
    electionId: string;
    electionTitle: string;
    judges: { candidateId: string; name: string; title: string | null }[];
    // judgeCandidateId -> "OK" | "NO"
    current: Record<string, JudgeReviewChoice> | null;
};

export type JudgeReviewConfirmRequest = {
    electionId: string;
    choices: { judgeCandidateId: string; choice: JudgeReviewChoice }[];
};
