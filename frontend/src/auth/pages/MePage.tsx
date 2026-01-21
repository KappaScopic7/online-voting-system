// auth/pages/MePage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMeDetail, type MeDetailResponse } from "../api/auth";
import { useAuth } from "../AuthContext";

export function MePage() {
    const { refreshMe } = useAuth();

    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const load = async () => {
        setIsLoading(true);
        setMsg(null);
        try {
            const data = await fetchMeDetail();
            setMe(data);
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";

    const onRefreshAll = async () => {
        setMsg(null);
        try {
            await refreshMe();
            await load();
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Failed to refresh");
        }
    };

    const isDev = import.meta.env?.DEV;

    if (isLoading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: 760, padding: 16, display: "grid", gap: 12 }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h2 style={{ margin: 0 }}>My Page</h2>
                <button type="button" onClick={onRefreshAll}>
                    再読み込み
                </button>
            </header>

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            {!me ? (
                <div>Not loaded</div>
            ) : (
                <>
                    {/* Status */}
                    <section style={{ padding: 12, border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>Status</h3>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            <li>
                                Email Verified:{" "}
                                <b>{String(me.emailVerified)}</b>
                            </li>
                            <li>
                                Identity Status:{" "}
                                <b>{String(me.identityStatus)}</b>
                            </li>
                            <li>
                                Enabled: <b>{String(me.enabled)}</b>
                            </li>
                            <li>
                                Locked: <b>{String(me.locked)}</b>
                            </li>
                        </ul>

                        <div
                            style={{
                                marginTop: 10,
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {/* 一覧は "/elections" */}
                            <Link to="/elections" state={{ from }}>
                                選挙一覧へ
                            </Link>

                            <Link to="/me/votes" state={{ from }}>
                                投票履歴へ
                            </Link>

                            {!me.emailVerified && (
                                <Link
                                    to="/verify"
                                    state={{ email: me.email, from }}
                                >
                                    メール認証へ
                                </Link>
                            )}

                            {isPending && (
                                <Link
                                    to="/me/identity/pending"
                                    state={{ from }}
                                >
                                    本人認証：審査中
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* Account detail */}
                    <section>
                        <h3 style={{ marginBottom: 8 }}>Account</h3>
                        <table
                            style={{
                                borderCollapse: "collapse",
                                width: "100%",
                            }}
                        >
                            <tbody>
                                {Object.entries(me).map(([k, v]) => (
                                    <tr key={k}>
                                        <td
                                            style={{
                                                padding: "6px 12px",
                                                borderBottom: "1px solid #ddd",
                                                fontWeight: 600,
                                                width: 220,
                                            }}
                                        >
                                            {k}
                                        </td>
                                        <td
                                            style={{
                                                padding: "6px 12px",
                                                borderBottom: "1px solid #ddd",
                                            }}
                                        >
                                            {v === null ? "null" : String(v)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Identity section */}
                    <section style={{ padding: 12, border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>本人認証</h3>

                        {isLinked ? (
                            <p style={{ margin: 0 }}>
                                現在: <b>投票可能（本人認証済み）</b>
                            </p>
                        ) : isPending ? (
                            <div style={{ display: "grid", gap: 8 }}>
                                <p style={{ margin: 0 }}>
                                    現在: <b>投票不可（本人認証：審査中）</b>
                                </p>
                                <Link
                                    to="/me/identity/pending"
                                    state={{ from }}
                                >
                                    審査状況へ →
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                                <p style={{ margin: 0 }}>
                                    現在: <b>投票不可（本人認証が必要）</b>
                                </p>
                                <Link to="/me/identity" state={{ from }}>
                                    本人認証へ進む →
                                </Link>
                            </div>
                        )}
                    </section>
                </>
            )}

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            { me, msg, identityStatus, isLoading },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
