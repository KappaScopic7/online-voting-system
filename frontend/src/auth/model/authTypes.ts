// frontend/src/auth/model/authTypes.ts
export type TokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: string | null;
};

export type IdentityStatus = "NOT_LINKED" | "PENDING" | "LINKED";

export type AccountKind = "USER" | "STAFF";

export type Role = "VOTER" | "ADMIN" | "COMMITTEE";

export type MeResponse = {
    accountId: string;
    kind: AccountKind;
    role: Role | null;
    email?: string;
    emailVerified?: boolean;
    identityStatus?: IdentityStatus;
    enabled: boolean;
    locked: boolean;
};

export type MeDetailResponse = {
    accountId: string;
    email: string;
    role: Role | null; // ← string|null だったけど揃えるのが気持ちいい
    emailVerified: boolean;
    enabled: boolean;
    locked: boolean;
    citizenId: string | null;
    identityStatus: IdentityStatus;
    createdAt: string;
    updatedAt: string;
};
