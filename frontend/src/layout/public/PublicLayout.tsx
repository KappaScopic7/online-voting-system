// frontend/src/layout/PublicLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
//import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useEffect, useRef, useState } from "react";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();
    //const { staff, logout: staffLogout } = useStaffAuth();

    //const isDev = import.meta.env?.DEV;

    // ★ reset UI state
    //const [resetMsg, setResetMsg] = useState<string | null>(null);
    //const [resetting, setResetting] = useState(false);
    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);   

    const onLogout = () => {
        //if (staff) {
            //staffLogout();
            //nav("/", { replace: true });
            //return;
        //}
        if (user) {
            userLogout();
            setIsMenuOpen(false);
            nav("/", { replace: true });
        }
    };

    // ★ 「demo + staff + admin」だけ見せる（staff.role が取れない場合は staff がいるだけでもOK）
    //const isAdminStaff =
        //!!staff && (String((staff as any)?.role ?? "") === "ADMIN");

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
        <Link to="/" style={{ display: "flex", gap: 10 }}><img className={styles.logoImage} 
        src="https://www.city.machida.tokyo.jp/images/2024_header_logo.png" alt="Logo+トップページへ" /></Link>
        {/* 任意の写真を使いました */}
        <div className={styles.headerin}>
        {/* 未ログイン状態 */}
        {!user && (<>
        <span style={{ fontSize: 12, opacity: 0.7 }}>未ログイン状態</span>
            <Link className={styles.navlink} to="/login">ログイン</Link>
            <Link className={styles.navlink} to="/register">新規登録</Link>
        </>)}
        {/* ログイン状態 */}
        {user && (<>
        <div className={styles.menubutton} ref={menuRef}>


            <button className={styles.menubutton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className="fa-regular fa-user"></i>
            </button>
            

            {isMenuOpen && (
                <div className={`${styles.menuopen} ${showTopBar ? styles.withShadow : ""}`}>
                    <div><Link className={styles.navlink} to="/me">マイページ →</Link></div>
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} to="/notice">お知らせ →</Link></div>  
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} to="/me/votes">投票履歴 →</Link></div> 
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} to="/account-setting">アカウント設定 →</Link></div>
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} to="/profil-eEdit">プロフィール編集 →</Link></div>
                    <hr className={styles.divider} />
                    <div><Link className={styles.navlink} to="/me/identity">本人確認 →</Link></div>
                    <hr className={styles.divider} />
                    <div><button className={styles.menubutton} type="button" onClick={onLogout}>ログアウト</button></div>
                </div>
            )}
            </div></>)}
        </div>
    </header>

    <nav className={styles.nav}>
        {!user && (<>
        <Link to="/elections" className={styles.navlink}>選挙一覧</Link>|
        <Link to="/partys" className={styles.navlink}>政党一覧</Link>|
        <Link to="/help" className={styles.navlink}>問い合わせ</Link>
        </>)}
        {user && (<>
        <Link to="/elections" className={styles.navlink}>選挙一覧</Link>|
        <Link to="/partys" className={styles.navlink}>政党一覧</Link>|
        <Link to="/me/elections" className={styles.navlink}>My選挙</Link>|
        <Link to="/help" className={styles.navlink}>問い合わせ</Link>
        </>)}
    </nav>      
    </div>
    <Outlet />


    <footer className={styles.footer}>
        <span style={{ opacity: 0.7 }}>© OVS / B-team</span>
    </footer>
</div>
);
}
