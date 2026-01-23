// me/model/profileTypes.ts

export type MeProfileSource = "SELF";

export type MeProfileResponse = {
    accountId: string;
    source: MeProfileSource;
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
