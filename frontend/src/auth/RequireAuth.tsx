// auth/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthed } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!isAuthed) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    return <>{children}</>;
}
