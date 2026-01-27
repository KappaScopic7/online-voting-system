// frontend/src/demo/personas.ts

export type DemoPersona = {
    key: string;
    label: string;
    description: string;

    // login 用
    email: string;
    password: string;

    // identity 用（未認証は ""）
    citizenId: string;
};

export const demoPersonas = {
    voter: {
        guest01: {
            key: "voter-guest-01",
            label: "ゲスト（メール認証済み）",
            description:
                "citizenId=null。本人認証前。SELFプロフィール入力でMy選挙判定。",
            email: "voter_guest_01@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        guest02Unverified: {
            key: "voter-guest-02-unverified",
            label: "ゲスト（メール未認証）",
            description:
                "emailVerified=false。ログイン後にメール認証導線の確認用。",
            email: "voter_guest_02@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        machidaOk: {
            key: "voter-machida-ok",
            label: "町田市民・年齢OK",
            description:
                "本人認証済み。投票可能（町田13209 / minAge=18 などの確認用）。",
            email: "voter_machida_ok@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440000",
        },

        machidaUnderage: {
            key: "voter-machida-underage",
            label: "町田市民・年齢NG",
            description: "本人認証済みだが年齢不足。minAge判定の確認用。",
            email: "voter_machida_underage@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440001",
        },

        yokohamaOutside: {
            key: "voter-yokohama-outside",
            label: "横浜市民（町田の対象外）",
            description:
                "本人認証済みだが cityCode=14100。町田13209選挙の対象外確認用。",
            email: "voter_yokohama_outside@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440002",
        },

        machidaBorder18: {
            key: "voter-machida-border18",
            label: "18歳境界（誕生日判定）",
            description:
                "本人認証済み。誕生日境界の年齢判定確認用（例: 2008-10-25生）。",
            email: "voter_machida_border18@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440003",
        },

        machidaOver30: {
            key: "voter-machida-over30",
            label: "町田市民・30歳以上",
            description:
                "本人認証済み。minAge=30 選挙（demo_machida_minage30_open）確認用。",
            email: "voter_machida_over30@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440004",
        },

        disabled: {
            key: "voter-disabled",
            label: "無効化ユーザー",
            description: "enabled=false。ログイン拒否（403など）の確認用。",
            email: "voter_disabled@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        locked: {
            key: "voter-locked",
            label: "ロック済みユーザー",
            description: "locked=true。ログイン拒否（403など）の確認用。",
            email: "voter_locked@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },
    },

    admin: {
        label: "管理者",
        loginId: "admin",
        password: "Passw0rd!!",
    },

    committee: {
        label: "委員会",
        loginId: "committee",
        password: "Passw0rd!!",
    },
} as const;
