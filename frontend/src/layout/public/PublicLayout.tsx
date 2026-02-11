import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PublicLayout.module.css";
import logo from "../../assets/logo/ovs-logo.png";

type NavItem = { to: string; label: string };
type MenuItem = { to: string; label: string };

// ★追加：フッターバーの型
export type FooterAction =
    | { kind: "BACK"; label?: string }
    | { kind: "LINK"; to: string; label: string }
    | {
          kind: "BUTTON";
          label: string;
          onClick: () => void;
          disabled?: boolean;
      };

export type PublicLayoutOutletContext = {
    setFooterActions: (actions: FooterAction[] | null) => void;
};

export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();

    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapRef = useRef<HTMLDivElement>(null);

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
        ];

        if (!user) return common;
        return [
            ...common,
            { to: "/me/elections", label: "My選挙" },
            { to: "/me/favorites", label: "ブックマーク" },
        ];
    }, [user]);

    const menuItems = useMemo<MenuItem[]>(
        () => [
            { to: "/me", label: "マイページ →" },
            { to: "/me/favorites", label: "ブックマーク →" },
            { to: "/me/votes", label: "投票履歴 →" },
            { to: "/me/identity", label: "本人確認 →" },
        ],
        [user],
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

    // ★追加：フッターアクション管理（デフォルト BACK）
    const [footerActions, setFooterActions] = useState<FooterAction[] | null>(
        null,
    );

    const effectiveFooterActions: FooterAction[] =
        footerActions && footerActions.length > 0
            ? footerActions
            : [{ kind: "BACK", label: "戻る" }];

    return (
        <div className={styles.page}>
            <div
                className={`${styles.publicLayout} ${
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
                                            className={`${styles.menuOpen} ${showTopBar ? styles.withShadow : ""}`}
                                            role="menu"
                                        >
                                            {menuItems.map((item, idx) => (
                                                <div key={item.to}>
                                                    <Link
                                                        className={
                                                            styles.menuLink
                                                        }
                                                        to={item.to}
                                                        onClick={closeMenu}
                                                        role="menuitem"
                                                    >
                                                        {item.label}
                                                    </Link>

                                                    {idx !==
                                                        menuItems.length -
                                                            1 && (
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
                <Outlet
                    context={
                        {
                            setFooterActions,
                        } satisfies PublicLayoutOutletContext
                    }
                />
            </main>

            <div
                className={styles.footerBar}
                role="navigation"
                aria-label="ページ操作"
            >
                <div className={styles.footerBarInner}>
                    {effectiveFooterActions.map((a, i) => {
                        if (a.kind === "BACK") {
                            return (
                                <button
                                    key={`back:${i}`}
                                    type="button"
                                    className={styles.footerPrimaryButton}
                                    onClick={() => nav(-1)}
                                >
                                    {a.label ?? "戻る"}
                                </button>
                            );
                        }
                        if (a.kind === "LINK") {
                            return (
                                <Link
                                    key={`link:${a.to}:${i}`}
                                    to={a.to}
                                    className={styles.footerPrimaryButton}
                                >
                                    {a.label}
                                </Link>
                            );
                        }
                        return (
                            <button
                                key={`btn:${a.label}:${i}`}
                                type="button"
                                className={styles.footerPrimaryButton}
                                onClick={a.onClick}
                                disabled={a.disabled}
                            >
                                {a.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <footer className={styles.footer}>
                <span className={styles.footerText}>© OVS / B-team</span>
            </footer>
        </div>
    );
}
