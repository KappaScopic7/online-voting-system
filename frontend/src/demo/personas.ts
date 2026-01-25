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
        unlinked01: {
            key: "voter-unlinked-01",
            label: "有権者（未本人認証①）",
            description: "SELFプロフィールのみ。本人認証前。",
            email: "voter_unlinked_01@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        unlinked02: {
            key: "voter-unlinked-02",
            label: "有権者（未本人認証②）",
            description: "別ユーザーの未本人認証状態。",
            email: "voter_unlinked_02@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        machidaOk: {
            key: "voter-machida-ok",
            label: "町田市民・年齢OK",
            description: "本人認証済み。投票可能。",
            email: "voter_linked_ok@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440000",
        },

        underage: {
            key: "voter-underage",
            label: "町田市民・年齢NG",
            description: "本人認証済みだが年齢不足。",
            email: "voter_linked_underage@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440001",
        },

        outsideCity: {
            key: "voter-outside-city",
            label: "市外在住",
            description: "本人認証済みだが町田市外。",
            email: "voter_linked_outside_city@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440002",
        },

        border18: {
            key: "voter-border-18",
            label: "18歳境界（誕生日判定）",
            description:
                "基準日=2026-10-25想定。ちょうど18歳（2008-10-25生まれ）。",
            email: "voter_linked_border18@example.com",
            password: "Passw0rd!!",
            citizenId: "550e8400-e29b-41d4-a716-446655440003",
        },

        disabled: {
            key: "voter-disabled",
            label: "無効化ユーザー",
            description: "enabled=false。ログイン不可。",
            email: "disabled_user@example.com",
            password: "Passw0rd!!",
            citizenId: "",
        },

        locked: {
            key: "voter-locked",
            label: "ロック済みユーザー",
            description: "locked=true。ログイン不可。",
            email: "locked_user@example.com",
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
