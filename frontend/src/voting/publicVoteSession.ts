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
 * PIN + payload + electionId から PUBLICセッショントークンを発行して保存
 * - 移行期間はレスポンスの key を両対応にする（token / publicToken / voteToken）
 */
export async function issueAndStorePublicVoteToken(params: {
    electionId: string;
    payload: string;
    pin: string;
}): Promise<string> {
    const r: any = await issueVoteToken(params);

    const token =
        typeof r?.token === "string" && r.token.trim()
            ? r.token.trim()
            : typeof r?.publicToken === "string" && r.publicToken.trim()
              ? r.publicToken.trim()
              : typeof r?.voteToken === "string" && r.voteToken.trim()
                ? r.voteToken.trim()
                : null;

    if (!token) {
        throw new Error("PUBLIC token missing in response");
    }

    publicToken.set(token);
    return token;
}
