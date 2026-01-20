// auth/api/staffAuth.ts
import { http } from "../../shared/http";

/**
 * staff login response
 */
export type StaffTokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: "ADMIN" | "COMMITTEE" | null;
};

/**
 * staff me response
 */
export type StaffMeResponse = {
    accountId: string;
    loginId: string;
    role: "ADMIN" | "COMMITTEE";
    enabled: boolean;
    locked: boolean;
};

/**
 * staff login
 */
export async function staffLogin(
    loginId: string,
    password: string,
): Promise<StaffTokenResponse> {
    const res = await http.post<StaffTokenResponse>("/api/staff/auth/login", {
        loginId,
        password,
    });
    return res.data;
}

/**
 * staff me
 */
export async function fetchStaffMe(): Promise<StaffMeResponse> {
    const res = await http.get<StaffMeResponse>("/api/staff/auth/me");
    return res.data;
}
