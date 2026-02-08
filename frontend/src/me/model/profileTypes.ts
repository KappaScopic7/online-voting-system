// frontend/src/me/model/profileTypes.ts

export type MeProfileSource = "SELF" | "CITIZEN";

export type MeProfileResponse = {
    accountId: string;
    source: MeProfileSource;

    // 未登録 / 部分登録を許容
    birthDate?: string | null; // yyyy-MM-dd
    prefCode?: string | null;
    cityCode?: string | null;

    createdAt?: string | null;
    updatedAt?: string | null;
};

export type MeProfileUpdateRequest = {
    birthDate?: string;
    prefCode?: string;
    cityCode?: string;
};
