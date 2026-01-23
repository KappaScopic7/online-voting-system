import { httpUser } from "../../shared/httpUser";

export type MeEligibilityResponse = {
    source: "SELF" | "CITIZEN" | "NONE";
    birthDate: string | null; // yyyy-MM-dd
    prefCode: string | null;
    cityCode: string | null;
};

export async function fetchMeEligibility(): Promise<MeEligibilityResponse> {
    return httpUser.get("/api/me/eligibility");
}
