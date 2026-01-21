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

    // メール未認証なら verify へ
    if (!me.emailVerified) {
        return <Navigate to="/verify" replace state={{ from }} />;
    }

    // 本人認証ステータスで分岐
    switch (me.identityStatus) {
        case "LINKED":
            break; // 投票OK

        // PENDING を導線にするなら App.tsx と MePage と合わせてここもON
        // case "PENDING":
        //     return <Navigate to="/me/identity/pending" replace state={{ from }} />;

        default: // NOT_LINKED など
            return <Navigate to="/me/identity" replace state={{ from }} />;
    }

    return <>{children}</>;
}
