// frontend/src/identity/pages/IdentityPendingPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";

type LocationState = {
    from?: string;
};

export function IdentityPendingPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const from = state.from ?? "/me";

    const { me, refreshMe } = useAuth();

    const [msg, setMsg] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const check = async () => {
        setMsg(null);
        setIsRefreshing(true);
        try {
            await refreshMe();
        } catch (e: any) {
            setMsg(e?.response?.data?.message ?? "Failed to refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // 初回も一応最新化（任意）
        check();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // meの状態で遷移
        if (!me) return;

        if (me.identityStatus === "LINKED") {
            nav(from ?? "/me", { replace: true });
            return;
        }

        // 審査が解除/差し戻し等で未リンクに戻った場合
        if (me.identityStatus !== "PENDING") {
            nav("/me/identity", {
                replace: true,
                state: { from },
            });
        }
    }, [me, nav, from]);

    const isDev = import.meta.env?.DEV;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 640 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <h2 style={{ margin: 0 }}>本人認証（審査中）</h2>
                <span style={{ marginLeft: "auto" }}>
                    <Link to="/me">My Pageへ</Link>
                </span>
            </header>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                }}
            >
                <p style={{ margin: 0 }}>
                    現在、本人認証は <b>審査中</b>{" "}
                    です。完了までお待ちください。
                </p>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
                    このページは定期的に再読み込みして、認証完了（LINKED）になったら自動で戻ります。
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <button onClick={check} disabled={isRefreshing}>
                        {isRefreshing ? "更新中..." : "状態を更新"}
                    </button>

                    {state.from && (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            完了後は元の画面へ戻ります
                        </span>
                    )}
                </div>

                {msg && (
                    <div
                        role="alert"
                        style={{ padding: 8, border: "1px solid #ccc" }}
                    >
                        {msg}
                    </div>
                )}
            </div>

            <section style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/me/identity" state={{ from }}>
                    本人認証をやり直す
                </Link>
                <Link to="/">選挙一覧へ</Link>
            </section>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                me,
                                state,
                                msg,
                                isRefreshing,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
