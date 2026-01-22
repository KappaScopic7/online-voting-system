import { http } from "../../shared/http";

export type MeEligibilityResponse = {
    source: "SELF" | "CITIZEN" | "NONE";
    birthDate: string | null; // yyyy-MM-dd
    prefCode: string | null;
    cityCode: string | null;
};

export async function fetchMeEligibility(): Promise<MeEligibilityResponse> {
    return http.get("/api/me/eligibility");
}
