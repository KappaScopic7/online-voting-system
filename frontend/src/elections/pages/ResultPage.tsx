// elections/pages/ResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchResult, type ElectionResultResponse } from "../api/elections";

function percent(v: number, total: number) {
    if (total <= 0) return "0.0%";
    const p = (v / total) * 100;
    return `${p.toFixed(1)}%`;
}

export function ResultPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const [data, setData] = useState<ElectionResultResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        if (!electionId) return;
        setError(null);
        setIsForbidden(false);
        setIsLoading(true);
        try {
            const res = await fetchResult(electionId);
            setData(res);
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setIsForbidden(true);
                setError(msg ?? "この選挙はまだ結果を公開できません（未終了）");
            } else {
                setError(msg ?? "Failed to load result");
            }
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const sorted = useMemo(() => {
        if (!data) return [];
        return [...data.results].sort((a, b) => b.votes - a.votes);
    }, [data]);

    const maxVotes = useMemo(() => {
        return sorted.reduce((m, x) => Math.max(m, x.votes), 0);
    }, [sorted]);

    // 同票は同順位（簡易）
    const ranks = useMemo(() => {
        const map = new Map<string, number>();
        let rank = 0;
        let prevVotes: number | null = null;
        for (let i = 0; i < sorted.length; i++) {
            const v = sorted[i].votes;
            if (prevVotes === null || v !== prevVotes) {
                rank = i + 1;
                prevVotes = v;
            }
            map.set(sorted[i].candidateId, rank);
        }
        return map;
    }, [sorted]);

    const isDev = import.meta.env?.DEV;

    if (!electionId) return <div>Invalid electionId</div>;

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 860 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/">← 戻る（選挙一覧）</Link>
                <Link to={`/elections/${electionId}/candidates`}>候補者へ</Link>
                <h2 style={{ margin: 0 }}>Result</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading}
                >
                    {isLoading ? "Reloading..." : "Reload"}
                </button>
            </header>

            {/* 状態カード */}
            {error && (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                    }}
                    role="alert"
                >
                    <p style={{ marginTop: 0, marginBottom: 8 }}>{error}</p>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={load}>再試行</button>
                        <Link to={`/elections/${electionId}/candidates`}>
                            候補者へ
                        </Link>
                        <Link to="/">選挙一覧へ</Link>
                    </div>

                    {isForbidden && (
                        <p
                            style={{
                                marginBottom: 0,
                                marginTop: 8,
                                fontSize: 13,
                                opacity: 0.8,
                            }}
                        >
                            ※
                            結果は「選挙が終了している」「結果公開フラグがON」などの条件で表示される想定
                        </p>
                    )}
                </div>
            )}

            {/* Loading */}
            {!error && isLoading && <p>Loading...</p>}

            {/* Result */}
            {!error && !isLoading && data && (
                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <strong style={{ fontSize: 16 }}>{data.title}</strong>
                        <span style={{ opacity: 0.85 }}>
                            総投票数: {data.totalVotes}
                        </span>
                    </div>

                    {sorted.length === 0 ? (
                        <p style={{ margin: 0 }}>結果データがありません</p>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {sorted.map((r) => {
                                const ratioToTop =
                                    maxVotes > 0
                                        ? (r.votes / maxVotes) * 100
                                        : 0;
                                const p = percent(r.votes, data.totalVotes);

                                return (
                                    <div
                                        key={r.candidateId}
                                        style={{ display: "grid", gap: 4 }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                alignItems: "baseline",
                                            }}
                                        >
                                            <span>
                                                <b>
                                                    #
                                                    {ranks.get(r.candidateId) ??
                                                        "-"}
                                                </b>{" "}
                                                {r.candidateName}
                                            </span>
                                            <span style={{ opacity: 0.9 }}>
                                                {r.votes}票（{p}）
                                            </span>
                                        </div>

                                        {/* バー（仮）：色指定は後でCSSクラスへ逃がすのが理想 */}
                                        <div
                                            style={{
                                                height: 10,
                                                border: "1px solid #ddd",
                                                borderRadius: 999,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${ratioToTop}%`,
                                                    height: "100%",
                                                    borderRadius: 999,
                                                    background: "#999", // 仮
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* DEV */}
            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                data,
                                error,
                                sorted,
                                maxVotes,
                                electionId,
                                isForbidden,
                                isLoading,
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
