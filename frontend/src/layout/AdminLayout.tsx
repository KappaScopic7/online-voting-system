// frontend/src/layout/AdminLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../staff/StaffAuthContext";

export function AdminLayout() {
    const nav = useNavigate();
    const { staff, logout } = useStaffAuth();

    const onLogout = () => {
        logout();
        nav("/", { replace: true });
    };

    return (
        <div style={{ padding: 16 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/admin">Admin Home</Link>
                <Link to="/admin/elections">Elections</Link>
                <Link to="/admin/staff">Staff</Link>
                <Link to="/admin/me">Me</Link>

                <span style={{ marginLeft: "auto" }}>
                    {staff && <button onClick={onLogout}>Logout</button>}
                </span>
            </header>

            <Outlet />
        </div>
    );
}
