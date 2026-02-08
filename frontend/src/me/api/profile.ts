import { httpUser } from "../../shared/httpUser";
import type {
    MeProfileResponse,
    MeProfileUpdateRequest,
} from "../model/profileTypes";

export async function getMeProfile(): Promise<MeProfileResponse> {
    const res = await httpUser.get<MeProfileResponse>("/me/profile");
    return res.data;
}

export async function getMeProfileOrNull(): Promise<MeProfileResponse | null> {
    const res = await httpUser.get("/me/profile", {
        validateStatus: (s) => s === 200 || s === 204,
    });
    if (res.status === 204) return null;
    return res.data ?? null;
}

export async function putMeProfile(
    req: MeProfileUpdateRequest,
): Promise<MeProfileResponse> {
    const res = await httpUser.put<MeProfileResponse>("/me/profile", req);
    return res.data;
}
