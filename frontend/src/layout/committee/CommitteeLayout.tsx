import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useStaffAuth } from "../../staff/StaffAuthContext";

type NavItem = { to: string; label: string };

export function CommitteeLayout() {
    const nav = useNavigate();
    const loc = useLocation();
    const { staff, logout } = useStaffAuth();

    const onLogout = () => {
        logout();
        nav("/", { replace: true });
    };

    const navItems = useMemo<NavItem[]>(
        () => [
            { to: "/committee", label: "Home" },
            { to: "/committee/elections", label: "Elections" },
            { to: "/committee/staff", label: "Staff" },
            { to: "/committee/me", label: "Me" },
        ],
        [],
    );

    const isActive = (to: string) =>
        to === "/committee"
            ? loc.pathname === "/committee"
            : loc.pathname.startsWith(to);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: "white",
                    borderBottom: "1px solid #e5e7eb",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 16px",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        to="/committee"
                        style={{
                            fontWeight: 800,
                            textDecoration: "none",
                            color: "black",
                        }}
                    >
                        OVS Committee
                    </Link>

                    <nav
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        {navItems.map((it) => (
                            <Link
                                key={it.to}
                                to={it.to}
                                style={{
                                    textDecoration: "none",
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    background: isActive(it.to)
                                        ? "#f3f4f6"
                                        : "transparent",
                                    color: "black",
                                }}
                            >
                                {it.label}
                            </Link>
                        ))}
                    </nav>

                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        {staff ? (
                            <>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "#6b7280",
                                    }}
                                >
                                    {staff.loginId} ({staff.role})
                                </span>

                                <button
                                    type="button"
                                    onClick={onLogout}
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #e5e7eb",
                                        background: "white",
                                        cursor: "pointer",
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/committee/login"
                                style={{
                                    textDecoration: "none",
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    background: "white",
                                    color: "black",
                                }}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: 16 }}>
                <Outlet />
            </main>

            <footer
                style={{
                    padding: 12,
                    borderTop: "1px solid #e5e7eb",
                    color: "#6b7280",
                    fontSize: 12,
                    textAlign: "center",
                }}
            >
                © OVS / B-team
            </footer>
        </div>
    );
}
