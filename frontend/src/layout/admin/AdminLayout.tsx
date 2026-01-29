// frontend/src/layout/AdminLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useEffect, useRef, useState } from "react";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
    const nav = useNavigate();
    const { staff, logout } = useStaffAuth();
    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);   
    const handleMenuClick = () => {
    setIsMenuOpen(false);
};
   // const isDev = import.meta.env?.DEV;

    // // ★ reset UI state
    // const [resetMsg, setResetMsg] = useState<string | null>(null);
    // const [resetting, setResetting] = useState(false);

    const onLogout = () => {
            logout();
            setIsMenuOpen(false);
            nav("/", { replace: true });
        }

         // ★ 「demo + staff + admin」だけ見せる（staff.role が取れない場合は staff がいるだけでもOK）
    // const isAdminStaff =
    //     !!staff && (String((staff as any)?.role ?? "") === "ADMIN");

    // // ★ DB reset action
    // const onResetDemoDb = async () => {
    //     setResetMsg(null);

    //     if (!staff) {
    //         setResetMsg("STAFFでログインしていません");
    //         return;
    //     }
    //     if (!isAdminStaff) {
    //         setResetMsg("ADMIN権限が必要です");
    //         return;
    //     }

    //     const ok = window.confirm(
    //         "DBをリセットしてデモデータを入れ直します。\n本当に実行しますか？",
    //     );
    //     if (!ok) return;

    //     try {
    //         setResetting(true);

    //         // StaffAuthContext の持ち方に合わせてここを調整してね（例: staff.accessToken / staff.token など）
    //         const accessToken =
    //             (staff as any)?.accessToken ??
    //             (staff as any)?.token?.accessToken ??
    //             (staff as any)?.token;

    //         if (!accessToken) {
    //             setResetMsg("STAFFのアクセストークンが見つかりません");
    //             return;
    //         }

    //         const res = await fetch("/api/demo/reset", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${accessToken}`,
    //             },
    //             body: JSON.stringify({ confirm: "RESET" }),
    //         });

    //         if (!res.ok) {
    //             const text = await res.text().catch(() => "");
    //             throw new Error(text || `HTTP ${res.status}`);
    //         }

    //         // ログイン状態は残したまま画面だけ更新（データ取り直し）
    //         window.location.reload();
    //     } catch (e: any) {
    //         setResetMsg(e?.message ?? "DBリセットに失敗しました");
    //     } finally {
    //         setResetting(false);
    //     }
        
    // };

    useEffect(() => {
 
    const onScroll = () => {
        if (tickingRef.current) return;
        tickingRef.current = true;
        window.requestAnimationFrame(() => {
            const y = window.scrollY;
            const lastY = lastYRef.current;
            const diff = y - lastY;  
            const THRESHOLD = 20;    
            const TOP_LOCK = 60;     

            if (y <= TOP_LOCK) {
                setShowTopBar(true);
            } else if (Math.abs(diff) >= THRESHOLD) {
                setShowTopBar(diff < 0);  
                lastYRef.current = y;
            }
            tickingRef.current = false;
        });
    };
    const handleClickOutside = (event: MouseEvent) => {
         
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
 
    window.addEventListener("scroll", onScroll, { passive: true });

 
    if (isMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [isMenuOpen]);  


return (
<div style={{ padding: 16 }}>
    <div className={`${styles.publicLayout} ${showTopBar ? styles.headerVisible : styles.headerHidden}`}>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>



    <header className={styles.header}>
        <Link to="/admin" className={styles.adminlogo}>管理者</Link>
        <div className={styles.headerin}>
        {/* 未ログイン状態 */}
        {/* ログイン状態 */}
        
        <div className={styles.menubutton} ref={menuRef}>


            <button className={styles.menubutton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className="fa-solid fa-wrench"></i>
            </button>
            

            {isMenuOpen && (
                <div className={`${styles.menuopen} ${showTopBar ? styles.withShadow : ""}`}>
                    <div><Link className={styles.navlink} onClick={handleMenuClick} to="/admin/me">管理者情報 →</Link></div>
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} onClick={handleMenuClick} to="/admin/elections">セキュリティー設定 →</Link></div>  
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} onClick={handleMenuClick} to="/admin/elections">障害検知/アラート対応 →</Link></div> 
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} onClick={handleMenuClick} to="/admin/elections">バックアップ/リストア →</Link></div>
                    <hr className={styles.divider} />
                    <div><button className={styles.menubutton} type="button" onClick={onLogout}>ログアウト</button></div>
                </div>
            )}
            </div> 
        </div>
    </header>

    <nav className={styles.nav}>
        <Link to="/admin/elections" className={styles.navlink}>選挙管理</Link>|
        <Link to="/admin/elections" className={styles.navlink}>政党管理</Link>|
        <Link to="/admin/elections" className={styles.navlink}>候補者管理</Link>|
        <Link to="/admin/staff" className={styles.navlink}>アカウント管理</Link>|
        <Link to="/admin/elections" className={styles.navlink}>ログ一覧</Link>
    </nav>      
    </div>
    <Outlet />
        <footer className={styles.footer}>
        <span style={{ opacity: 0.7 }}>© OVS / B-team</span>

        {/* ★ DB reset button 
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
        )}*/}
    </footer>
    </div>
    );
}
