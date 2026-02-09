// frontend/src/layout/committee/CommitteeLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CommitteeLayout.module.css";

type NavItem = { to: string; label: string };
type MenuItem = { to: string; label: string };

export function CommitteeLayout() {
    const nav = useNavigate();
    const { staff, logout } = useStaffAuth();

    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapRef = useRef<HTMLDivElement>(null);

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen((v) => !v);

    const onLogout = () => {
        logout();
        closeMenu();
        nav("/committee/login", { replace: true });
    };

    // Committee: 選挙管理 + User/Voter(最小)
    const navItems = useMemo<NavItem[]>(
        () => [
            { to: "/committee/elections", label: "選挙管理" },
            { to: "/committee/voters", label: "有権者管理" }, // 無ければ後で消す/追加
            { to: "/committee/me", label: "Me" },
        ],
        [],
    );

    // 右上メニュー（最小）
    const menuItems = useMemo<MenuItem[]>(
        () => [
            { to: "/committee", label: "ホーム →" },
            { to: "/committee/elections", label: "選挙管理 →" },
            { to: "/committee/voters", label: "有権者管理 →" },
            { to: "/committee/me", label: "Me →" },
        ],
        [],
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
                className={`${styles.committeeLayout} ${
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

                        <Link
                            to="/committee"
                            className={styles.brand}
                            onClick={closeMenu}
                            aria-label="委員会トップへ"
                        >
                            選挙管理（委員会）
                        </Link>

                        <div className={styles.headerRight}>
                            <div ref={menuWrapRef} className={styles.menuWrap}>
                                <button
                                    type="button"
                                    className={styles.menuButton}
                                    onClick={toggleMenu}
                                    aria-haspopup="menu"
                                    aria-expanded={isMenuOpen}
                                    aria-label="委員会メニュー"
                                >
                                    <span aria-hidden>🛠️</span>
                                </button>

                                {isMenuOpen && (
                                    <div
                                        className={`${styles.menuOpen} ${
                                            showTopBar ? styles.withShadow : ""
                                        }`}
                                        role="menu"
                                    >
                                        {/* staff info */}
                                        <div className={styles.menuMeta}>
                                            {staff ? (
                                                <>
                                                    <div
                                                        className={
                                                            styles.menuMetaTitle
                                                        }
                                                    >
                                                        {staff.loginId}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.menuMetaSub
                                                        }
                                                    >
                                                        {staff.role}
                                                    </div>
                                                </>
                                            ) : (
                                                <div
                                                    className={
                                                        styles.menuMetaSub
                                                    }
                                                >
                                                    未ログイン
                                                </div>
                                            )}
                                        </div>

                                        <hr className={styles.divider} />

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

                                        {staff ? (
                                            <button
                                                className={styles.logoutButton}
                                                type="button"
                                                onClick={onLogout}
                                                role="menuitem"
                                            >
                                                ログアウト
                                            </button>
                                        ) : (
                                            <Link
                                                className={styles.menuLink}
                                                to="/committee/login"
                                                onClick={closeMenu}
                                                role="menuitem"
                                            >
                                                ログイン →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <nav className={styles.nav} aria-label="委員会ナビ">
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
                        className={`${styles.drawerOverlay} ${
                            isMobileNavOpen ? styles.drawerOverlayOpen : ""
                        }`}
                        onClick={() => setIsMobileNavOpen(false)}
                        aria-hidden={!isMobileNavOpen}
                    >
                        <aside
                            className={`${styles.drawerPanel} ${
                                isMobileNavOpen ? styles.drawerPanelOpen : ""
                            }`}
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

                                <hr className={styles.drawerDivider} />

                                {staff ? (
                                    <button
                                        type="button"
                                        className={styles.drawerLogout}
                                        onClick={onLogout}
                                    >
                                        ログアウト
                                    </button>
                                ) : (
                                    <Link
                                        to="/committee/login"
                                        className={styles.drawerLink}
                                        onClick={() =>
                                            setIsMobileNavOpen(false)
                                        }
                                    >
                                        ログイン →
                                    </Link>
                                )}
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
