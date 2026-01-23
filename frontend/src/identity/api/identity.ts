// identity/api/identity.ts
import { http } from "../../shared/http";
import type { TokenResponse } from "../../auth/model/authTypes";

export async function linkIdentity(citizenId: string): Promise<TokenResponse> {
    const res = await http.post<TokenResponse>("/api/identity/link", {
        citizenId,
    });
    return res.data;
}
