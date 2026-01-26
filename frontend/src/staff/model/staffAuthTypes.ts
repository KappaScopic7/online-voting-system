// frontend/src/staff/model/staffAuthTypes.ts
export type StaffTokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: "ADMIN" | "COMMITTEE";
};

export type StaffMeResponse = {
    accountId: string;
    loginId: string;
    role: "ADMIN" | "COMMITTEE";
    enabled: boolean;
    locked: boolean;
};
