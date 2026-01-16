// auth/api/auth.ts
import { http } from "../../shared/http";

export type TokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: string | null;
};

export type IdentityStatus = "NOT_LINKED" | "LINKED";

export type MeResponse = {
    accountId: string;
    email: string;
    role: string | null;
    emailVerified: boolean;
    identityStatus: IdentityStatus;
};

export type MeDetailResponse = {
    accountId: string;
    email: string;
    role: string | null;
    emailVerified: boolean;
    enabled: boolean;
    locked: boolean;
    citizenId: string | null;
    identityStatus: IdentityStatus;
    createdAt: string;
    updatedAt: string;
};

export async function register(email: string, password: string): Promise<void> {
    await http.post("/api/auth/register", { email, password });
}

export async function verifyEmail(email: string, code: string): Promise<void> {
    await http.post("/api/auth/verify", { email, code });
}

export async function login(
    email: string,
    password: string,
): Promise<TokenResponse> {
    const res = await http.post<TokenResponse>("/api/auth/login", {
        email,
        password,
    });
    return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
    const res = await http.get<MeResponse>("/api/auth/me");
    return res.data;
}

export async function fetchMeDetail(): Promise<MeDetailResponse> {
    const res = await http.get<MeDetailResponse>("/api/auth/me/detail");
    return res.data;
}
