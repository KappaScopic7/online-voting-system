// auth/RequireCommittee.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireCommittee({ children }: { children: React.ReactNode }) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        return (
            <Navigate
                to="/committee/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    if (me.kind !== "STAFF") {
        return <Navigate to="/" replace />;
    }

    if (me.role !== "COMMITTEE") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
