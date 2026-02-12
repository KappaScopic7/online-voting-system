import { httpPublic } from "../../shared/httpPublic";

export type NfcExchangeRequest = {
    ticket: string;
    electionId: string; // service側で使ってないが、DTOバリデーション通すため送る
};

export type TokenResponse = {
    accessToken: string;
    tokenType: string; // "Bearer"
    expiresIn: number;
    refreshToken?: string | null;
};

export async function exchangeNfcTicket(req: NfcExchangeRequest) {
    const res = await httpPublic.post<TokenResponse>("/auth/nfc/exchange", req);
    return res.data;
}
