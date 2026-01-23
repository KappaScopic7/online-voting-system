// auth/api/authApi.ts
import { http } from "../../shared/http";
import type {
    MeDetailResponse,
    MeResponse,
    TokenResponse,
} from "../model/authTypes";

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
