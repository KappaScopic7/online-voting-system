// frontend/src/staff/api/staffAuth.ts
import { httpStaff } from "../../shared/httpStaff";
import type { StaffMeResponse, StaffTokenResponse } from "../model/staffAuthTypes";

export async function staffLogin(
    loginId: string,
    password: string,
): Promise<StaffTokenResponse> {
    const res = await httpStaff.post<StaffTokenResponse>(
        "/api/staff/auth/login",
        { loginId, password },
    );
    return res.data;
}

export async function fetchStaffMe(): Promise<StaffMeResponse> {
    const res = await httpStaff.get<StaffMeResponse>("/api/staff/auth/me");
    return res.data;
}

// export async function fetchStaffMeDetail(): Promise<StaffMeResponse> {
//     const res = await httpStaff.get<StaffMeResponse>("/api/staff/auth/me/detail");
//     return res.data;
// }