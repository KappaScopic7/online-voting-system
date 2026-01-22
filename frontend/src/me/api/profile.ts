import { apiFetch } from "../../shared/apiFetch";

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
    birthDate: string; // yyyy-MM-dd
    prefCode: string;
    cityCode: string;
};

export async function getMeProfile(): Promise<MeProfileResponse> {
    return apiFetch("/api/me/profile");
}

export async function putMeProfile(
    req: MeProfileUpdateRequest,
): Promise<MeProfileResponse> {
    return apiFetch("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify(req),
    });
}
