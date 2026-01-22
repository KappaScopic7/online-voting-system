// src/staff/token/staffToken.ts
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

const TOKEN_EXPIRES_IN = "2h";

export type StaffRole = "ADMIN" | "COMMITTEE";

export type StaffPayload = {
    id: string;
    email: string;
    role: StaffRole;
};

const ISSUER = "online-voting-system";
const AUDIENCE = "staff";

// JWT発行
export function generateStaffToken(payload: StaffPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN,
        issuer: ISSUER,
        audience: AUDIENCE,
    });
}

// JWT検証
export function verifyStaffToken(token: string): StaffPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE,
        }) as StaffPayload;
    } catch {
        return null;
    }
}

// 管理者判定
export function isAdminToken(token: string): boolean {
    return verifyStaffToken(token)?.role === "ADMIN";
}
