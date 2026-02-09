export type SystemAnnouncement = {
    enabled: boolean;
    actor: "SYSTEM_ADMIN" | "COMMITTEE";
    message: string;
    updatedAt?: string | null;
};
