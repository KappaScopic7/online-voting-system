// auth/RequireVerifiedEmail.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireVerifiedEmail({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;
    if (!me) return <Navigate to="/login" replace />;

    // 未認証なら verify 画面へ（戻り先を渡す）
    if (!me.emailVerified) {
        return (
            <Navigate
                to="/verify"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );
    }

    return <>{children}</>;
}
