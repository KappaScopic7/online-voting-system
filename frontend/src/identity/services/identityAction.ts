// frontend/src/identity/services/identityAction.ts

import { linkIdentity } from "../api/identity";
import { issueVoteToken } from "../../public/api/voteToken";
import { publicToken } from "../../shared/tokenStorage";

export type IdentityActionMode = "IDENTITY_LINK" | "VOTE_TOKEN_ISSUE";

export type IdentityActionResult =
    | { kind: "LINK"; accessToken: string }
    | { kind: "VOTE"; voteToken: string };

export async function performIdentityAction(params: {
    mode: IdentityActionMode;

    // NFC raw data
    payload: string;

    // PIN
    pin: string;

    // VOTE
    electionId?: string;

    // auth side effect
    setAccessToken: (token: string) => Promise<void> | void;
}): Promise<IdentityActionResult> {
    const { mode, payload, pin, electionId, setAccessToken } = params;

    if (mode === "IDENTITY_LINK") {
        // 🔐 恒久認証：必ず payload＋PIN を送る
        const res = await linkIdentity({
            payload,
            pin,
        });

        await setAccessToken(res.accessToken);
        return { kind: "LINK", accessToken: res.accessToken };
    }

    // 🔵 一時投票
    const res = await issueVoteToken({
        electionId: String(electionId),
        payload,
        pin,
    });

    publicToken.set(res.voteToken);

    return { kind: "VOTE", voteToken: res.voteToken };
}
