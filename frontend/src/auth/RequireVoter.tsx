// auth/RequireVoter.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireVoter({ children }: { children: React.ReactNode }) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;
    if (!me)
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );

    // メール未認証なら verifyへ
    if (!me.emailVerified)
        return (
            <Navigate
                to="/verify"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );

    // ★ 投票可否は role じゃなく identityLinked で見る
    if (!me.identityLinked)
        return (
            <Navigate
                to="/identity/link"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );

    return <>{children}</>;
}
