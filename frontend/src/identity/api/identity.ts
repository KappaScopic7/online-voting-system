// frontend/src/identity/api/identity.ts
import { httpUser } from "../../shared/httpUser";
import type { UserTokenResponse } from "../../user/model/userAuthTypes";

export async function linkIdentity(
    citizenId: string,
): Promise<UserTokenResponse> {
    const res = await httpUser.post<UserTokenResponse>("/identity/link", {
        citizenId,
    });
    return res.data;
}

// export async function linkIdentityByNfc(serialNumber: string): Promise<UserTokenResponse> {
//     const res = await httpUser.post<UserTokenResponse>("/identity/link/nfc", { serialNumber });
//     return res.data;
// }
