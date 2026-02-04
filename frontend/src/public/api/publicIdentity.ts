import { httpPublic } from "../../shared/httpPublic";

export type NfcVerifyResponse = {
    accessToken: string;
    tokenType: string; // "Bearer"
    expiresInSeconds: number;
};

export async function verifyNfc(
    uuid: string,
    electionId: string,
): Promise<NfcVerifyResponse> {
    const res = await httpPublic.post<NfcVerifyResponse>(
        "/public/identity/verify",
        {
            uuid,
            electionId,
        },
    );
    return res.data;
}
