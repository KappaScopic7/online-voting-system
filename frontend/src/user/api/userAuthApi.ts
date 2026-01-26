// frontend/src/user/api/userAuthApi.ts
import { httpUser } from "../../shared/httpUser";
import type {
    MeDetailResponse,
    MeResponse,
    TokenResponse,
} from "../../auth/model/authTypes";

export async function register(email: string, password: string): Promise<void> {
    await httpUser.post("/api/auth/register", { email, password });
}

export async function verifyEmail(email: string, code: string): Promise<void> {
    await httpUser.post("/api/auth/verify", { email, code });
}

export async function login(
    email: string,
    password: string,
): Promise<TokenResponse> {
    const res = await httpUser.post<TokenResponse>("/api/auth/login", {
        email,
        password,
    });
    return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
    const res = await httpUser.get<MeResponse>("/api/auth/me");
    return res.data;
}

export async function fetchMeDetail(): Promise<MeDetailResponse> {
    const res = await httpUser.get<MeDetailResponse>("/api/auth/me/detail");
    return res.data;
}
