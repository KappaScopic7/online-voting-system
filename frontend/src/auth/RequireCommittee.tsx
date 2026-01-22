// auth/RequireCommittee.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStaffAuth } from "../staff/StaffAuthContext";

export function RequireCommittee({ children }: { children: React.ReactNode }) {
    const { isLoading, staff } = useStaffAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    // 未ログイン
    if (!staff) {
        return (
            <Navigate
                to="/committee/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    // 委員会のみ許可
    if (staff.role !== "COMMITTEE") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
