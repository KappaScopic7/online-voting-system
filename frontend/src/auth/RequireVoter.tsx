// auth/RequireVoter.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { normalizeFrom } from "../shared/normalizeFrom";

export function RequireVoter({ children }: { children: React.ReactNode }) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();
    const from = normalizeFrom(loc.pathname + loc.search);

    if (isLoading) return <div>Loading...</div>;

    if (!me) return <Navigate to="/login" replace state={{ from }} />;

    if (me.emailVerified !== true) {
        return <Navigate to="/verify" replace state={{ from }} />;
    }

    const st = me.identityStatus ?? "NOT_LINKED";

    if (st === "PENDING") {
        return <Navigate to="/me/identity/pending" replace state={{ from }} />;
    }
    if (st !== "LINKED") {
        return <Navigate to="/me/identity" replace state={{ from }} />;
    }

    return <>{children}</>;
}
