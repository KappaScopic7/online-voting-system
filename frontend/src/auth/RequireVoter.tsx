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

    // メール未認証なら verify へ
    if (!me.emailVerified)
        return (
            <Navigate
                to="/verify"
                replace
                state={{ from: loc.pathname + loc.search }}
            />
        );

    // ★ 本人認証ステータスで分岐
    switch (me.identityStatus) {
        case "LINKED":
            break; // 投票OK
        // case "PENDING":
        //     return (
        //         <Navigate
        //             to="/identity/pending"
        //             replace
        //             state={{ from: loc.pathname + loc.search }}
        //         />
        //     );
        default: // NOT_LINKED など
            return (
                <Navigate
                    to="/identity/link"
                    replace
                    state={{ from: loc.pathname + loc.search }}
                />
            );
    }

    return <>{children}</>;
}
