// frontend/src/candidates/model/resolveCandidateImage.ts
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

export function resolveCandidateImage(
    candidateKey: string,
    imageUrl?: string | null,
) {
    return resolveCandidateImageUrl(candidateKey) ?? imageUrl ?? null;
}
