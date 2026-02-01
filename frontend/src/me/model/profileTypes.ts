// frontend/src/me/model/profileTypes.ts
export type MeProfileSource = "SELF" | "CITIZEN";

export type MeProfileResponse = {
    accountId: string;
    source: MeProfileSource;
    birthDate: string;
    prefCode: string;
    cityCode: string;
    createdAt: string;
    updatedAt: string;
};

export type MeProfileUpdateRequest = {
    birthDate?: string;
    prefCode?: string;
    cityCode?: string;
};
