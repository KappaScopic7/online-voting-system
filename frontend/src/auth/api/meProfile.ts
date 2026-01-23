// auth/api/meProfile.ts
import { httpUser } from "../../shared/httpUser";

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
    const res = await httpUser.get<MeProfileResponse>("/api/me/profile");
    return res.data;
}

export async function putMeProfile(
    req: MeProfileUpdateRequest,
): Promise<MeProfileResponse> {
    const res = await httpUser.put<MeProfileResponse>("/api/me/profile", req);
    return res.data;
}
