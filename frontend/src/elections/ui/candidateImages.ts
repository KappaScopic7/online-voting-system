// frontend/src/elections/ui/candidateImages.ts

// candidateKey → public の URL
const byKey: Record<string, string> = {
    candidate_001: "/assets/candidates/candidate-001.png",
    candidate_002: "/assets/candidates/candidate-002.png",
    candidate_003: "/assets/candidates/candidate-003.png",
    candidate_004: "/assets/candidates/candidate-004.png",
    candidate_005: "/assets/candidates/candidate-005.png",
};

export function resolveCandidateImageUrl(candidateKey?: string | null) {
    if (!candidateKey) return null;
    return byKey[candidateKey] ?? null;
}

// いまは id→画像の対応がないと一覧では出せないので一旦 null 返す
export function resolveCandidateImageUrlById(_candidateId: string) {
    return null;
}
