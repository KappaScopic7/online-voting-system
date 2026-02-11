export type SystemAnnouncement = {
    enabled: boolean;
    actor: "ADMIN" | "COMMITTEE";
    message: string;
    updatedAt?: string | null;
};
