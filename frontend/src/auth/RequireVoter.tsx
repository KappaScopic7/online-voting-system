// auth/RequireVoter.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireVoter({ children }: { children: React.ReactNode }) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        return <Navigate to="/login" replace state={{ from }} />;
    }

    if (!me.emailVerified) {
        return <Navigate to="/verify" replace state={{ from }} />;
    }

    switch (me.identityStatus) {
        case "LINKED":
            break;

        case "PENDING":
            return (
                <Navigate to="/me/identity/pending" replace state={{ from }} />
            );

        default:
            return <Navigate to="/me/identity" replace state={{ from }} />;
    }

    return <>{children}</>;
}
