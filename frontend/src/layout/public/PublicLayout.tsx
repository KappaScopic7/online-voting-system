// frontend/src/layout/PublicLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useState } from "react";

export function PublicLayout() {
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

    // ★ DB reset action
    const onResetDemoDb = async () => {
        setResetMsg(null);

        if (!staff) {
            setResetMsg("STAFFでログインしていません");
            return;
        }
        if (!isAdminStaff) {
            setResetMsg("ADMIN権限が必要です");
            return;
        }

        const ok = window.confirm(
            "DBをリセットしてデモデータを入れ直します。\n本当に実行しますか？",
        );
        if (!ok) return;

        try {
            setResetting(true);

            // StaffAuthContext の持ち方に合わせてここを調整してね（例: staff.accessToken / staff.token など）
            const accessToken =
                (staff as any)?.accessToken ??
                (staff as any)?.token?.accessToken ??
                (staff as any)?.token;

            if (!accessToken) {
                setResetMsg("STAFFのアクセストークンが見つかりません");
                return;
            }

            const res = await fetch("/api/demo/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ confirm: "RESET" }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `HTTP ${res.status}`);
            }

            // ログイン状態は残したまま画面だけ更新（データ取り直し）
            window.location.reload();
        } catch (e: any) {
            setResetMsg(e?.message ?? "DBリセットに失敗しました");
        } finally {
            setResetting(false);
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

            <footer
                style={{
                    marginTop: 24,
                    opacity: 0.85,
                    fontSize: 12,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                    borderTop: "1px solid #eee",
                    paddingTop: 12,
                }}
            >
                <span style={{ opacity: 0.7 }}>© OVS / B-team</span>

                {/* ★ DB reset button */}
                {isDev && staff && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={onResetDemoDb}
                            disabled={!isAdminStaff || resetting}
                            title={
                                !isAdminStaff
                                    ? "ADMINでログインしたSTAFFのみ実行できます"
                                    : "DBをリセットしてデモデータを再投入します"
                            }
                            style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                border: "1px solid #d99",
                            }}
                        >
                            {resetting ? "DBリセット中..." : "DBリセット（demo）"}
                        </button>

                        {resetMsg && (
                            <span style={{ color: "crimson" }}>{resetMsg}</span>
                        )}
                    </div>
                )}
            </footer>
        </div>
    );
}
