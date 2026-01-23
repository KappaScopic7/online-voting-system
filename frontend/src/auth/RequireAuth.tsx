// auth/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { normalizeFrom } from "../shared/normalizeFrom";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthed } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!isAuthed) {
        const from = normalizeFrom(loc.pathname + loc.search);
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <>{children}</>;
}
