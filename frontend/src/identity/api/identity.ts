// identity/api/identity.ts
import { httpUser } from "../../shared/httpUser";
import type { TokenResponse } from "../../auth/model/authTypes";

export async function linkIdentity(citizenId: string): Promise<TokenResponse> {
    const res = await httpUser.post<TokenResponse>("/api/identity/link", {
        citizenId,
    });
    return res.data;
}
