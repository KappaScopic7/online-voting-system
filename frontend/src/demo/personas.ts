export const demoPersonas = {
    voter: {
        // SELF→CITIZEN上書きを見せたいなら unlinked を使うのが一番分かりやすい
        email: "voter_unlinked_01@example.com",
        password: "Passw0rd!!",

        // 町田市民（CITIZEN）
        citizenIdMachidaOk: "550e8400-e29b-41d4-a716-446655440000",

        // デモ用：投票不可を見せたい時
        citizenIdUnderage: "550e8400-e29b-41d4-a716-446655440001",
        citizenIdOutsideCity: "550e8400-e29b-41d4-a716-446655440002",
    },
    admin: {
        loginId: "admin",
        password: "Passw0rd!!",
    },
    committee: {
        loginId: "committee",
        password: "Passw0rd!!",
    },
} as const;
