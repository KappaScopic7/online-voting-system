// src/admin/api/staff.ts
export type StaffListItem = {
    staffId: string;
    loginId: string;
    email: string;
    role: string;
    enabled: boolean;
    createdAt: string;
};

export async function fetchStaffList(): Promise<StaffListItem[]> {
    const res = await fetch("/api/admin/staff", {
        credentials: "include",
    });
    //    if (!res.ok) throw new Error("Failed to load staff");
    return res.json();
}
