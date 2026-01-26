// frontend/src/elections/pages/CandidatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchCandidates } from "../api/elections";
import type { CandidateItem } from "../model/electionTypes";

export function CandidatesPage() {
    const { electionId } = useParams<{ electionId: string }>();
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        if (!electionId) return;
        setError(null);
        setIsLoading(true);
        try {
            const data = await fetchCandidates(electionId);
            setItems(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to load candidates",
            );
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const canStartVote = useMemo(() => {
        if (!electionId) return false;
        if (items === null) return false;
        if (items.length === 0) return false;
        return true;
    }, [electionId, items]);

    const isDev = import.meta.env?.DEV;

    if (!electionId) return <div>Invalid electionId</div>;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 860 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link to="/">← 戻る（選挙一覧）</Link>
                <h2 style={{ margin: 0 }}>Candidates</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading}
                >
                    {isLoading ? "Reloading..." : "Reload"}
                </button>
            </header>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {isDev && (
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                        electionId: {electionId}
                    </span>
                )}

                <Link
                    to={`/elections/${electionId}/result`}
                    style={{ marginLeft: "auto" }}
                >
                    結果ページへ →
                </Link>
            </div>

            {error && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <span>{error}</span>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </div>
            )}

            {items === null ? (
                <p>Loading...</p>
            ) : items.length === 0 ? (
                <div
                    style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                    }}
                >
                    <p style={{ marginTop: 0 }}>候補者がいません</p>
                    <p style={{ marginBottom: 0, opacity: 0.8, fontSize: 13 }}>
                        候補者が登録されていないため、この選挙は投票できません（想定）。
                    </p>
                </div>
            ) : (
                <section style={{ display: "grid", gap: 8 }}>
                    {items.map((c) => (
                        <div
                            key={c.candidateId}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 12,
                                display: "grid",
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    alignItems: "center",
                                }}
                            >
                                <strong style={{ fontSize: 16 }}>
                                    {c.name}
                                </strong>
                                {isDev && (
                                    <span
                                        style={{ fontSize: 12, opacity: 0.6 }}
                                    >
                                        {c.candidateId}
                                    </span>
                                )}
                            </div>

                            <div style={{ fontSize: 13, opacity: 0.85 }}>
                                候補者の詳細（所属・公約など）はここに表示（仮）
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* CTA: vote */}
            <section style={{ paddingTop: 8, borderTop: "1px solid #eee" }}>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {/* ★ 投票導線を /voting/start に統一 + from を付与 */}
                    <Link
                        to={`/voting/start?electionId=${electionId}`}
                        state={{ from }}
                    >
                        <button disabled={!canStartVote}>
                            {canStartVote ? "投票を開始" : "投票を開始（不可）"}
                        </button>
                    </Link>

                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        ※
                        本人認証やメール認証が必要な場合は投票画面で誘導されます
                    </span>
                </div>
            </section>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify({ items, error, isLoading }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
