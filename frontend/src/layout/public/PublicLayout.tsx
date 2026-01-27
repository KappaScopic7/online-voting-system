// frontend/src/layout/PublicLayout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { useEffect, useRef, useState } from "react";


export function PublicLayout() {
    const nav = useNavigate();
    const { me: user, logout: userLogout } = useAuth();
    const { staff, logout: staffLogout } = useStaffAuth();

    const isDev = import.meta.env?.DEV;

    // ★ reset UI state
    const [resetMsg, setResetMsg] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [showTopBar, setShowTopBar] = useState(true);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);   

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
useEffect(() => {
    // 1. 스크롤 로직
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

    // 2. 외부 클릭 감지 로직
    const handleClickOutside = (event: MouseEvent) => {
        // menuRef가 있고, 클릭한 대상(event.target)이 menuRef 내부에 포함되지 않았다면 닫기
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };

    // 스크롤 이벤트는 항상 등록
    window.addEventListener("scroll", onScroll, { passive: true });

    // 메뉴가 열려있을 때만 외부 클릭 리스너 등록
    if (isMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [isMenuOpen]); // ★ 중요: isMenuOpen이 바뀔 때마다 함수가 최신 상태를 참조하도록 함







    return (
    
        <div style={{ padding: 16 }}>
    <div
    style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "white",
        transition: "transform 180ms ease",
        transform: showTopBar ? "translateY(0)" : "translateY(-110%)",
        boxShadow: showTopBar ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
    }}
    >
        <link 
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
    <header
        style={{
        display: "flex",
        gap: 12,
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap",
        }}
    >


    
        <Link to="/" style={{ display: "flex", gap: 10 }}>
        <img src="写真パース" alt="Logo+トップページへ" />
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
        
        {!user && (//未ログイン状態
            <>
            <span style={{ fontSize: 12, opacity: 0.7 }}>未ログイン状態</span>
            <Link to="/login">ログイン</Link>
            <Link to="/register">新規登録</Link>
            </>
            )}


        {user && (//ログイン状態
        
            <>
            <div 
            ref={menuRef} 
            style={{ 
                position: 'relative', 
                display: 'inline-block', // 버튼 크기만큼만 차지해서 sticky 방해 안함
                marginLeft: '10px' 
            }}
        >
            <button style={{
            }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className="fa-solid fa-user"></i>
            </button>
            

            {isMenuOpen && (
                <div style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 64.5px)', 
                    right: 0, 
                    backgroundColor: '#ffffff', 
                    padding: 10,
                    boxShadow: showTopBar ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
                    border: "1px solid #ddd",
                    minWidth: '200px',        // 메뉴의 최소 너비를 지정
                    whiteSpace: 'nowrap',     // 글자가 옆으로 퍼지지 않고 한 줄에 나오게 함
                    display: 'flex',          // 내부 아이템 정렬
                    flexDirection: 'column'
                    }}>
                    <div><Link to="/me">マイページ</Link></div> 
                    <div><Link to="/login">お知らせ</Link></div>  
                    <div><Link to="/me/votes">投票履歴</Link></div> 
                    <div><Link to="/login">アカウント設定</Link></div>
                    <div><Link to="/login">プロフィル編集</Link></div>
                    <div><Link to="/login">問い合わせ</Link></div>
                    <div><button type="button" onClick={onLogout}>
                        ログアウト
                    </button></div>
                </div>
            )}
   </div> </>
        )}
        </div>
    </header>

    <nav
        style={{
        gap: 0,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        border: "1px solid",
        }}
    >
        <Link to="/" style={{ flex: 1, padding: 12, textAlign: "center" }}>
        トップへ
        </Link>
        |
        <Link to="/elections" style={{ flex: 1, padding: 12, textAlign: "center" }}>
        選挙一覧
        </Link>

        {user && (
        <>
            |<Link to="/me/identity" style={{ flex: 1, padding: 12, textAlign: "center" }}>本人確認</Link>|
            <Link to="/me/elections" style={{ flex: 1, padding: 12, textAlign: "center" }}>My選挙</Link>
        </>
        )}
    </nav>
    </div>

    <Outlet />


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
