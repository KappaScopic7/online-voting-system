// frontend/src/candidates/pages/ElectionCandidatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchElectionCandidates } from "../api/candidates";
import type { CandidateItem } from "../model/candidateTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

type LocationState = { from?: string };

export function ElectionCandidatesPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/elections");
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        if (!electionId) return;
        setError(null);
        setIsLoading(true);
        try {
            const cands = await fetchElectionCandidates(electionId);
            setItems(cands);
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

    const hasCandidates = useMemo(() => {
        return items !== null && items.length > 0;
    }, [items]);

    const isDev = import.meta.env?.DEV;

    if (!electionId) return <div>Invalid electionId</div>;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 860 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link to={backTo}>← 戻る</Link>
                <h2 style={{ margin: 0 }}>候補者一覧</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading}
                >
                    {isLoading ? "Reloading..." : "再読み込み"}
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
                    state={{ from }}
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
                    {items.map((c) => {
                        const detailUrl = `/elections/${electionId}/candidates/${c.id}`;

                        return (
                            <Link
                                key={c.id}
                                to={detailUrl}
                                state={{ from }}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 12,
                                    display: "grid",
                                    gap: 6,
                                    textDecoration: "none",
                                    color: "inherit",
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
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "center",
                                            minWidth: 0,
                                        }}
                                    >
                                        {/* ★ 顔写真を基本表示（candidateKeyで一致） */}
                                        <CandidateAvatar
                                            name={c.name}
                                            candidateKey={c.candidateKey}
                                            size={64}
                                        />

                                        <div
                                            style={{
                                                display: "grid",
                                                gap: 4,
                                                minWidth: 0,
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    fontSize: 16,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {c.name}
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.75,
                                                }}
                                            >
                                                {c.title ?? ""}
                                            </div>
                                        </div>
                                    </div>

                                    {isDev && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.6,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {c.id}
                                        </span>
                                    )}
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    候補者の詳細（所属・公約など）を見る →
                                </div>
                            </Link>
                        );
                    })}
                </section>
            )}

            <section style={{ paddingTop: 8, borderTop: "1px solid #eee" }}>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        to={`/voting/start?electionId=${electionId}`}
                        state={{ from }}
                        style={{
                            display: "inline-block",
                            padding: "8px 12px",
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            textDecoration: "none",
                            color: "inherit",
                            opacity: hasCandidates ? 1 : 0.5,
                            pointerEvents: hasCandidates ? "auto" : "none",
                        }}
                        aria-disabled={!hasCandidates}
                    >
                        {hasCandidates ? "投票を開始" : "投票を開始（不可）"}
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
                        {JSON.stringify(
                            { items, error, isLoading, backTo, from },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
