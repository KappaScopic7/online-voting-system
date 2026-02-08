// frontend/src/auth/routes/RequireVerifiedEmail.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { currentAsFrom, sanitizeReturnTo } from "./returnTo";

export function RequireVerifiedEmail() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    const rawFrom = currentAsFrom(loc.pathname, loc.search);
    const returnTo = sanitizeReturnTo(rawFrom ?? undefined, "/");

    if (!me) {
        return <Navigate to="/login" replace state={{ from: returnTo }} />;
    }

    // true 以外は未認証扱い
    if (me.emailVerified !== true) {
        // verify 側で email 入れたいなら email も渡すとUX良い
        return (
            <Navigate
                to="/verify"
                replace
                state={{ email: me.email, from: returnTo }}
            />
        );
    }

    return <Outlet />;
}
