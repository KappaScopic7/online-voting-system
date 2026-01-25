// frontend/src/demo/personas.ts
export const demoPersonas = {
    voter: {
        email: "0@example.com",
        password: "Passw0rd!!",
        citizenId: "550e8400-e29b-41d4-a716-446655440000",
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
