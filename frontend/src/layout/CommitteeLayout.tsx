// frontend/src/layout/CommitteeLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../staff/StaffAuthContext";

export function CommitteeLayout() {
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
                <Link to="/committee">Committee Home</Link>
                <Link to="/committee/elections">Elections</Link>
                <Link to="/committee/staff">Staff</Link>
                <Link to="/committee/me">Me</Link>

                <span style={{ marginLeft: "auto" }}>
                    {staff && <button onClick={onLogout}>Logout</button>}
                </span>
            </header>

            <Outlet />
        </div>
    );
}
