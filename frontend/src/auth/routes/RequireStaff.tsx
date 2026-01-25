// frontend/src/auth/routes/RequireStaff.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function RequireStaff(props: {
    role: "ADMIN" | "COMMITTEE";
    loginPath: "/admin/login" | "/committee/login";
}) {
    const { isLoading, staff } = useStaffAuth();
    const loc = useLocation();
    const from = normalizeFrom(loc.pathname + loc.search);

    if (isLoading) return <div>Loading...</div>;
    if (!staff)
        return <Navigate to={props.loginPath} replace state={{ from }} />;
    if (staff.role !== props.role) return <Navigate to="/" replace />;
    return <Outlet />;
}
