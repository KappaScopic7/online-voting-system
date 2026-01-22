// auth/RequireStaff.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStaffAuth } from "./StaffAuthContext";

export function RequireStaff({ children }: { children: React.ReactNode }) {
    const { isLoading, staff } = useStaffAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    // 未ログイン
    if (!staff) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    // 権限チェック
    if (staff.role !== "ADMIN" && staff.role !== "COMMITTEE") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
