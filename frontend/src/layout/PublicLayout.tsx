// frontend/src/layout/PublicLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStaffAuth } from "../staff/StaffAuthContext";

export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();
    const { staff, logout: staffLogout } = useStaffAuth();

    const onLogout = () => {
        if (staff) {
            staffLogout();
            nav("/", { replace: true });
            return;
        }
        if (user) {
            userLogout();
            nav("/", { replace: true });
        }
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
                <Link to="/">トップへ</Link>
                <Link to="/elections">選挙一覧</Link>

                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {!user && (
                        <>
                            <Link to="/register">新規登録</Link>
                            <Link to="/login">ログイン</Link>
                            <span style={{ fontSize: 12, opacity: 0.7 }}>
                                未ログイン
                            </span>
                        </>
                    )}

                    {user && (
                        <>
                            <Link to="/me">マイページ</Link>
                            <Link to="/me/identity">本人確認</Link>
                            <Link to="/me/elections">My選挙</Link>
                            <Link to="/me/votes">投票履歴</Link>
                            <button type="button" onClick={onLogout}>
                                ログアウト
                            </button>
                        </>
                    )}
                </div>
            </header>

            <Outlet />

            <footer style={{ marginTop: 24, opacity: 0.6, fontSize: 12 }}>
                © OVS / B-team
            </footer>
        </div>
    );
}
