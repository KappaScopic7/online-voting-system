// auth/RequireAdmin.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    if (me.kind !== "STAFF") {
        return <Navigate to="/" replace />;
    }

    if (me.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
