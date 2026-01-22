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
    return http.get("/api/me/profile").then((res) => res.data);
}

export async function putMeProfile(
    req: MeProfileUpdateRequest,
): Promise<MeProfileResponse> {
    return http.put("/api/me/profile", req).then((res) => res.data);
}
