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
    citizenId: string;

    // PIN
    pin?: string;
    pinRequired?: boolean;

    // VOTE
    electionId?: string;

    // auth side effect
    setAccessToken: (token: string) => Promise<void> | void;
}): Promise<IdentityActionResult> {
    const {
        mode,
        citizenId,
        pin = "",
        pinRequired = false,
        electionId,
        setAccessToken,
    } = params;

    if (mode === "IDENTITY_LINK") {
        const res = await linkIdentity({
            citizenId,
            pin: pinRequired ? pin : undefined,
        });
        await setAccessToken(res.accessToken);
        return { kind: "LINK", accessToken: res.accessToken };
    }

    // mode === "VOTE_TOKEN_ISSUE"
    const res = await issueVoteToken({
        electionId: String(electionId),
        payload: citizenId,
        pin: String(pin),
    });
    publicToken.set(res.voteToken);
    return { kind: "VOTE", voteToken: res.voteToken };
}
