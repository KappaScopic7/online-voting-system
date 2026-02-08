import { publicToken } from "../shared/tokenStorage";
import { issueVoteToken } from "./api/voteToken";

export type EnsurePublicVoteTokenArgs = {
    electionId: string;
    payload?: string | null; // NFC payload（URLに載せるなら短命で）
};

export async function ensurePublicVoteToken(
    args: EnsurePublicVoteTokenArgs,
): Promise<boolean> {
    // 既に token があるならOK
    if (publicToken.get()) return true;

    // payload が無いと発行できない（今のバックエンド仕様）
    if (!args.payload) return false;

    const r = await issueVoteToken({
        electionId: args.electionId,
        payload: args.payload,
    });

    publicToken.set(r.voteToken);
    return true;
}
