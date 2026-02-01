import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { currentAsFrom, sanitizeReturnTo } from "./returnTo";

export function RequireIdentityLinked() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    const rawFrom = currentAsFrom(loc.pathname, loc.search);
    const returnTo = sanitizeReturnTo(rawFrom ?? undefined, "/");

    if (!me) {
        return <Navigate to="/login" replace state={{ from: returnTo }} />;
    }

    const st = me.identityStatus ?? "NOT_LINKED";

    if (st === "PENDING") {
        return (
            <Navigate
                to="/me/identity/pending"
                replace
                state={{ from: returnTo }}
            />
        );
    }

    if (st !== "LINKED") {
        return (
            <Navigate to="/me/identity" replace state={{ from: returnTo }} />
        );
    }

    return <Outlet />;
}
