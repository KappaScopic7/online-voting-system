// frontend/src/layout/public/PublicLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./PublicLayout.module.css";
import logo from "../../assets/logo/ovs-logo.png";

type NavItem = { to: string; label: string };
type MenuItem = { to: string; label: string };

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

function footerActionEq(a: FooterAction, b: FooterAction): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === "BACK" && b.kind === "BACK")
        return (a.label ?? "") === (b.label ?? "");
    if (a.kind === "LINK" && b.kind === "LINK")
        return a.to === b.to && a.label === b.label;
    if (a.kind === "BUTTON" && b.kind === "BUTTON")
        return a.label === b.label && !!a.disabled === !!b.disabled;
    return false;
}
function footerActionsEq(a: FooterAction[] | null, b: FooterAction[] | null) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (!footerActionEq(a[i], b[i])) return false;
    return true;
}

export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();

    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);

    // PC: 👤
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuWrapRef = useRef<HTMLDivElement>(null);

    // Mobile: ☰（右上ポップオーバー）
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuWrapRef = useRef<HTMLDivElement>(null);

    const closeUserMenu = () => setIsMenuOpen(false);
    const toggleUserMenu = () => setIsMenuOpen((v) => !v);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);

    const closeAllMenus = () => {
        closeUserMenu();
        closeMobileMenu();
    };

    const onLogout = () => {
        if (!user) return;
        userLogout();
        closeAllMenus();
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
        [],
    );

    // header show/hide
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

                if (y <= TOP_LOCK) setShowTopBar(true);
                else if (Math.abs(diff) >= THRESHOLD) setShowTopBar(diff < 0);

                lastYRef.current = y;
                tickingRef.current = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // close menus on outside click / Esc
    useEffect(() => {
        if (!isMenuOpen && !isMobileMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const t = event.target as Node;

            const inUser =
                menuWrapRef.current && menuWrapRef.current.contains(t);
            const inMobile =
                mobileMenuWrapRef.current &&
                mobileMenuWrapRef.current.contains(t);

            if (!inUser) closeUserMenu();
            if (!inMobile) closeMobileMenu();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeAllMenus();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen, isMobileMenuOpen]);

    // footer actions
    const [footerActions, setFooterActions] = useState<FooterAction[] | null>(
        null,
    );

    const setFooterActionsSafe = useCallback((next: FooterAction[] | null) => {
        setFooterActions((prev) => (footerActionsEq(prev, next) ? prev : next));
    }, []);

    const defaultFooterActions = useMemo<FooterAction[]>(
        () => [{ kind: "BACK", label: "戻る" }],
        [],
    );

    const effectiveFooterActions = useMemo<FooterAction[]>(() => {
        return footerActions && footerActions.length > 0
            ? footerActions
            : defaultFooterActions;
    }, [footerActions, defaultFooterActions]);

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
                            onClick={closeAllMenus}
                            aria-label="トップページへ"
                        >
                            <img
                                className={styles.logoImage}
                                src={logo}
                                alt="OVS"
                            />
                            <span className={styles.brandText}>町田OVS</span>
                        </Link>

                        <div className={styles.headerRight}>
                            {/* ★モバイル用：右上に ☰ + ポップオーバー */}
                            <div
                                ref={mobileMenuWrapRef}
                                className={styles.mobileMenuWrap}
                            >
                                <button
                                    type="button"
                                    className={styles.hamburgerButton}
                                    aria-label="メニュー"
                                    aria-expanded={isMobileMenuOpen}
                                    onClick={toggleMobileMenu}
                                >
                                    ☰
                                </button>

                                {isMobileMenuOpen && (
                                    <div
                                        className={`${styles.menuOpen} ${styles.mobileMenuOpen}`}
                                        role="menu"
                                    >
                                        {navItems.map((item, idx) => (
                                            <div key={item.to}>
                                                <Link
                                                    className={styles.menuLink}
                                                    to={item.to}
                                                    onClick={closeAllMenus}
                                                    role="menuitem"
                                                >
                                                    {item.label}
                                                </Link>
                                                {idx !==
                                                    navItems.length - 1 && (
                                                    <hr
                                                        className={
                                                            styles.divider
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PC右側：常にアイコンを表示し、中身を分岐させる */}
                            <div ref={menuWrapRef} className={styles.menuWrap}>
                                <button
                                    type="button"
                                    className={styles.menuButton}
                                    onClick={toggleUserMenu}
                                    aria-haspopup="menu"
                                    aria-expanded={isMenuOpen}
                                    aria-label="ユーザーメニュー"
                                >
                                    <span aria-hidden>👤</span>
                                </button>

                                {isMenuOpen && (
                                    <div
                                        className={`${styles.menuOpen} ${
                                            showTopBar ? styles.withShadow : ""
                                        }`}
                                        role="menu"
                                    >
                                        {/* ▼▼▼ ここでログイン状態による出しわけを行う ▼▼▼ */}
                                        {user ? (
                                            // === ログインしている場合 ===
                                            <>
                                                {menuItems.map((item, idx) => (
                                                    <div key={item.to}>
                                                        <Link
                                                            className={
                                                                styles.menuLink
                                                            }
                                                            to={item.to}
                                                            onClick={
                                                                closeAllMenus
                                                            }
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
                                                <hr
                                                    className={styles.divider}
                                                />
                                                <button
                                                    className={
                                                        styles.logoutButton
                                                    }
                                                    type="button"
                                                    onClick={onLogout}
                                                    role="menuitem"
                                                >
                                                    ログアウト
                                                </button>
                                            </>
                                        ) : (
                                            // === ログインしていない場合 ===
                                            <>
                                                <Link
                                                    className={styles.menuLink}
                                                    to="/login"
                                                    onClick={closeAllMenus}
                                                    role="menuitem"
                                                >
                                                    ログイン
                                                </Link>

                                                <hr
                                                    className={styles.divider}
                                                />

                                                <Link
                                                    className={styles.menuLink}
                                                    to="/register"
                                                    onClick={closeAllMenus}
                                                    role="menuitem"
                                                >
                                                    新規登録
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* PC用 nav（スマホではCSSで隠す） */}
                    <nav className={styles.nav} aria-label="グローバルナビ">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={styles.navLink}
                                onClick={closeAllMenus}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            <main className={styles.main}>
                <Outlet
                    context={
                        {
                            setFooterActions: setFooterActionsSafe,
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
