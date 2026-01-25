// frontend/src/me/api/profile.ts
import { httpUser } from "../../shared/httpUser";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../model/profileTypes";

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
