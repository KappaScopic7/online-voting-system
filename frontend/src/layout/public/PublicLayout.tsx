import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PublicLayout.module.css";
import logo from "../../assets/logo/ovs-logo.png";

type NavItem = { to: string; label: string };

export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();

    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapRef = useRef<HTMLDivElement>(null);

    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen((v) => !v);

    const onLogout = () => {
        if (!user) return;
        userLogout();
        closeMenu();
        nav("/", { replace: true });
    };

    const navItems = useMemo<NavItem[]>(() => {
        const common: NavItem[] = [
            { to: "/elections", label: "選挙一覧" },
            { to: "/parties", label: "政党一覧" },
            { to: "/candidates", label: "候補者一覧" },
            // { to: "/help", label: "問い合わせ" },
        ];

        if (!user) return common;

        return [...common, { to: "/me/elections", label: "My選挙" }];
    }, [user]);

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
                className={`${styles.publicLayout} ${
                    showTopBar ? styles.headerVisible : styles.headerHidden
                }`}
            >
                <div className={styles.barInner}>
                    <header className={styles.header}>
                        <Link
                            to="/"
                            className={styles.brand}
                            onClick={closeMenu}
                            aria-label="トップページへ"
                        >
                            <img
                                className={styles.logoImage}
                                src={logo}
                                alt="OVS"
                            />
                        </Link>

                        <div className={styles.headerRight}>
                            {!user ? (
                                <>
                                    <span className={styles.headerMeta}>
                                        未ログイン
                                    </span>

                                    <Link
                                        className={styles.headerLink}
                                        to="/login"
                                        onClick={closeMenu}
                                    >
                                        ログイン
                                    </Link>

                                    <Link
                                        className={styles.headerLink}
                                        to="/register"
                                        onClick={closeMenu}
                                    >
                                        新規登録
                                    </Link>
                                </>
                            ) : (
                                <div
                                    ref={menuWrapRef}
                                    className={styles.menuWrap}
                                >
                                    <button
                                        type="button"
                                        className={styles.menuButton}
                                        onClick={toggleMenu}
                                        aria-haspopup="menu"
                                        aria-expanded={isMenuOpen}
                                        aria-label="ユーザーメニュー"
                                    >
                                        <span aria-hidden>👤</span>
                                    </button>

                                    {isMenuOpen && (
                                        <div
                                            className={`${styles.menuOpen} ${
                                                showTopBar
                                                    ? styles.withShadow
                                                    : ""
                                            }`}
                                            role="menu"
                                        >
                                            <Link
                                                className={styles.menuLink}
                                                to="/me"
                                                onClick={closeMenu}
                                                role="menuitem"
                                            >
                                                マイページ →
                                            </Link>

                                            <hr className={styles.divider} />

                                            <Link
                                                className={styles.menuLink}
                                                to="/me/votes"
                                                onClick={closeMenu}
                                                role="menuitem"
                                            >
                                                投票履歴 →
                                            </Link>

                                            <hr className={styles.divider} />

                                            <Link
                                                className={styles.menuLink}
                                                to="/me/identity"
                                                onClick={closeMenu}
                                                role="menuitem"
                                            >
                                                本人確認 →
                                            </Link>

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
                            )}
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
