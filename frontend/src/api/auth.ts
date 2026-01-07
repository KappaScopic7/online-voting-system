// api/auth.ts
import { http } from "./http";

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  role: string;
};

export type MeResponse = {
  email: string;
  role: string;
  identityLinked: boolean;
};

export async function register(email: string, password: string): Promise<void> {
  await http.post("/api/auth/register", { email, password });
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
