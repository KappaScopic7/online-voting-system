// frontend/src/layout/PublicHeaderLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useState } from "react";

export function PublicHeaderLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();
    const { staff, logout: staffLogout } = useStaffAuth();

    const isDev = import.meta.env?.DEV;

    // ★ reset UI state
    const [resetMsg, setResetMsg] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

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

    // ★ 「demo + staff + admin」だけ見せる（staff.role が取れない場合は staff がいるだけでもOK）
    const isAdminStaff =
        !!staff && (String((staff as any)?.role ?? "") === "ADMIN");



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
                <Link to="/" 
                style={{
                    display:"flex", 
                    gap:10}}>
                        <img src="写真パース" alt="Logo+トップページへ"></img>
                </Link>


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
                            <button type="button" onClick={onLogout}>
                                ログアウト
                            </button>
                        </>
                    )}
                </div>
                
            </header>
            <nav
                style={{
                    gap:0,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    border:"1px solid",
                
                }}>
                <Link to="/" style={{flex:1, padding:12, textAlign:"center"}}>トップへ</Link>|
                <Link to="/elections" style={{flex:1, padding:12, textAlign:"center"}}>選挙一覧</Link>
                {!user && (
                    <>
                </>
                )}
                {user && (
                    <>
                |<Link to="/me" style={{flex:1, padding:12, textAlign:"center"}}>マイページ</Link>|
                <Link to="/me/identity" style={{flex:1, padding:12, textAlign:"center"}}>本人確認</Link>|
                <Link to="/me/elections" style={{flex:1, padding:12, textAlign:"center"}}>My選挙</Link>|
                <Link to="/me/votes" style={{flex:1, padding:12, textAlign:"center"}}>投票履歴</Link>
                </>
                    )}
            </nav>
            <Outlet/>

            
        </div>
    );
}
