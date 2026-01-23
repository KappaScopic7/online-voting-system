// me/api/profile.ts
import { http } from "../../shared/http";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../model/profileTypes";

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
