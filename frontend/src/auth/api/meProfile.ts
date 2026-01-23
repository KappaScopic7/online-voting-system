// auth/api/meProfile.ts
import { http } from "../../shared/http";

export type MeProfileResponse = {
    accountId: string;
    source: "SELF";
    birthDate: string; // yyyy-MM-dd
    prefCode: string;
    cityCode: string;
    createdAt: string;
    updatedAt: string;
};

export type MeProfileUpdateRequest = {
    birthDate: string;
    prefCode: string;
    cityCode: string;
};

export async function getMeProfile(): Promise<MeProfileResponse> {
    const res = await http.get<MeProfileResponse>("/api/me/profile");
    return res.data;
}

export async function putMeProfile(
    req: MeProfileUpdateRequest,
): Promise<MeProfileResponse> {
    const res = await http.put<MeProfileResponse>("/api/me/profile", req);
    return res.data;
}
