// frontend/src/elections/ui/candidateImages.ts
import c001 from "../../assets/candidates/candidate-001.png";
import c002 from "../../assets/candidates/candidate-002.png";
import c003 from "../../assets/candidates/candidate-003.png";
import c004 from "../../assets/candidates/candidate-004.png";
import c005 from "../../assets/candidates/candidate-005.png";

const byCandidateKey: Record<string, string> = {
    "candidate-001": c001,
    "candidate-002": c002,
    "candidate-003": c003,
    "candidate-004": c004,
    "candidate-005": c005,
};

export function resolveCandidateImageUrl(candidateKey?: string | null) {
    if (!candidateKey) return null;
    return byCandidateKey[candidateKey] ?? null;
}

const byCandidateId: Record<string, string> = {
    // "uuid-string": c001,
};

export function resolveCandidateImageUrlById(candidateId?: string | null) {
    if (!candidateId) return null;
    return byCandidateId[candidateId] ?? null;
}
