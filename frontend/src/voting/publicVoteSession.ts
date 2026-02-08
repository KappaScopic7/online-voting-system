// frontend/src/voting/publicVoteSession.ts
import { publicToken } from "../shared/tokenStorage";
import { issueVoteToken } from "../public/api/voteToken";

export function setPublicVoteToken(token: string) {
    publicToken.set(token);
}

export function clearPublicVoteToken() {
    publicToken.clear();
}

export function getPublicVoteToken() {
    return publicToken.get();
}

/**
 * PIN + payload(UUID文字列) + electionId から voteToken を発行して保存
 */
export async function issueAndStorePublicVoteToken(params: {
    electionId: string;
    payload: string;
    pin: string;
}): Promise<string> {
    const r = await issueVoteToken(params);
    publicToken.set(r.voteToken);
    return r.voteToken;
}
