import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AdminLayout.module.css";
//import logo from "../../assets/logo/ovs-logo.png";

type NavItem = { to: string; label: string };
type MenuItem = { to: string; label: string };

export function AdminLayout() {
    const nav = useNavigate();
    const { staff: staff, logout: userLogout } = useStaffAuth();

    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapRef = useRef<HTMLDivElement>(null);

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen((v) => !v);

    const onLogout = () => {
        if (!staff) return;
        userLogout();
        closeMenu();
        nav("/", { replace: true });
    };

    const navItems = useMemo<NavItem[]>(
        () => [
            { to: "/admin/elections", label: "選挙管理" },
            { to: "/admin/elections", label: "政党管理" },
            { to: "/admin/elections", label: "候補者管理" },
            { to: "/admin/staff", label: "アカウント管理" },
            { to: "/admin/elections", label: "ログ一覧" },
            // { to: "/help", label: "問い合わせ" },
        ],
        [staff],
    );

    const menuItems = useMemo<MenuItem[]>(
        () => [
            { to: "/admin/me", label: "管理者情報 →" },
            { to: "/admin/elections", label: "セキュリティー設定 →" },
            { to: "/admin/elections", label: "障害検知/アラート対応 →" },
            { to: "/admin/elections", label: "バックアップ/リストア →" },
        ],
        [staff],
    );

    // ---- header show/hide on scroll (stable) ----
    useEffect(() => {
        lastYRef.current = window.scrollY;

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
                }

                // ★重要：毎回更新してズレを防ぐ
                lastYRef.current = y;
                tickingRef.current = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ---- close menu on outside click / Esc ----
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuWrapRef.current &&
                !menuWrapRef.current.contains(event.target as Node)
            ) {
                closeMenu();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMenu();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <div className={styles.page}>
            <div
                className={`${styles.adminLayout} ${
                    showTopBar ? styles.headerVisible : styles.headerHidden
                }`}
            >
                <div className={styles.barInner}>
                    <header className={styles.header}>
                        <button
                            type="button"
                            className={styles.hamburgerButton}
                            aria-label="メニュー"
                            aria-expanded={isMobileNavOpen}
                            onClick={() => setIsMobileNavOpen(true)}
                        >
                            ☰
                        </button>
                        <Link to="/admin" className={styles.adminlogo}>
                            管理者
                        </Link>

                        <div className={styles.headerRight}>
                            <div ref={menuWrapRef} className={styles.menuWrap}>
                                <button
                                    type="button"
                                    className={styles.menuButton}
                                    onClick={toggleMenu}
                                    aria-haspopup="menu"
                                    aria-expanded={isMenuOpen}
                                    aria-label="ユーザーメニュー"
                                >
                                    <span aria-hidden>
                                        <i className="fa-solid fa-wrench"></i>
                                    </span>
                                </button>
                                {/* ----------------------------------------- MenuOpne ----------------------------------------- */}

                                {isMenuOpen && (
                                    <div
                                        className={`${styles.menuOpen} ${showTopBar ? styles.withShadow : ""}`}
                                        role="menu"
                                    >
                                        {menuItems.map((item, idx) => (
                                            <div key={item.to}>
                                                <Link
                                                    className={styles.menuLink}
                                                    to={item.to}
                                                    onClick={closeMenu}
                                                    role="menuitem"
                                                >
                                                    {item.label}
                                                </Link>

                                                {idx !==
                                                    menuItems.length - 1 && (
                                                    <hr
                                                        className={
                                                            styles.divider
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ))}

                                        <hr className={styles.divider} />

                                        <button
                                            className={styles.logoutButton}
                                            type="button"
                                            onClick={onLogout}
                                            role="menuitem"
                                        >
                                            ログアウト
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <nav className={styles.nav} aria-label="グローバルナビ">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={styles.navLink}
                                onClick={closeMenu}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div
                        className={`${styles.drawerOverlay} ${isMobileNavOpen ? styles.drawerOverlayOpen : ""}`}
                        onClick={() => setIsMobileNavOpen(false)}
                        aria-hidden={!isMobileNavOpen}
                    >
                        <aside
                            className={`${styles.drawerPanel} ${isMobileNavOpen ? styles.drawerPanelOpen : ""}`}
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="モバイルメニュー"
                        >
                            <div className={styles.drawerHeader}>
                                <span className={styles.drawerTitle}>
                                    メニュー
                                </span>
                                <button
                                    type="button"
                                    className={styles.drawerClose}
                                    aria-label="閉じる"
                                    onClick={() => setIsMobileNavOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={styles.drawerBody}>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={styles.drawerLink}
                                        onClick={() =>
                                            setIsMobileNavOpen(false)
                                        }
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            <main className={styles.main}>
                <Outlet />
            </main>

            <footer className={styles.footer}>
                <span className={styles.footerText}>© OVS / B-team</span>
            </footer>
        </div>
    );
}
