// frontend/src/identity/api/identity.ts
import { httpUser } from "../../shared/httpUser";
import type { UserTokenResponse } from "../../user/model/userAuthTypes";

export async function linkIdentity(
    citizenId: string,
): Promise<UserTokenResponse> {
    const res = await httpUser.post<UserTokenResponse>("/api/identity/link", {
        citizenId,
    });
    return res.data;
}

//NFC追記文
export async function linkIdentityByNfc(
    serialNumber: string,
): Promise<UserTokenResponse> {
    // NFCのシリアルナンバーを送信するエンドポイント（サーバー側の実装に合わせてURLは調整してください）
    const res = await httpUser.post<UserTokenResponse>(
        "/api/identity/link/nfc",
        {
            serialNumber,
        },
    );
    return res.data;
}
