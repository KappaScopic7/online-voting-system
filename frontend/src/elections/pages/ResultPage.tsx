// frontend/src/elections/pages/ResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchResult } from "../api/elections";
import type { ElectionResultResponse } from "../model/electionTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";

type LocationState = { from?: string };

function percent(v: number, total: number) {
    if (total <= 0) return "0.0%";
    const p = (v / total) * 100;
    return `${p.toFixed(1)}%`;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function ResultRow({
    r,
    rank,
    isTop,
    barW,
    p,
    totalVotes,
}: {
    r: { candidateId: string; candidateName: string; votes: number };
    rank: number | null;
    isTop: boolean;
    barW: number;
    p: string;
    totalVotes: number;
}) {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
                background: hover ? "#fafafa" : "#fff",
                transition: "background 120ms ease",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "baseline",
                    flexWrap: "wrap",
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: isTop ? 800 : 700,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 34,
                            padding: "2px 8px",
                            border: "1px solid #eee",
                            borderRadius: 999,
                            fontSize: 12,
                            background: "#fafafa",
                        }}
                        title="順位"
                    >
                        #{rank ?? "-"}
                    </span>

                    <span style={{ fontSize: 14 }}>{r.candidateName}</span>

                    {isTop && (
                        <span
                            style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                border: "1px solid #eee",
                                borderRadius: 999,
                                background: "#fff",
                            }}
                            title="トップ（同率含む）"
                        >
                            🏆 1位
                        </span>
                    )}
                </span>

                <span style={{ opacity: 0.95 }}>
                    <b>{r.votes}</b> 票（{p}）
                </span>
            </div>

            {/* bar */}
            <div
                role="progressbar"
                aria-label={`${r.candidateName} の得票率`}
                aria-valuenow={
                    totalVotes > 0 ? (r.votes / totalVotes) * 100 : 0
                }
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                    height: 12,
                    border: "1px solid #eee",
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#fafafa",
                }}
            >
                <div
                    style={{
                        width: `${barW}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: isTop ? "#666" : "#999",
                    }}
                />
            </div>

            <DevDebug
                label="meta"
                value={{
                    candidateId: r.candidateId,
                    votes: r.votes,
                }}
            />
        </div>
    );
}

export function ResultPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/elections");
    const from = loc.pathname + loc.search;

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

    // 1位（同率）を強調
    const topRank = useMemo(() => {
        if (sorted.length === 0) return null;
        const topVotes = sorted[0].votes;
        if (topVotes <= 0) return null;
        return { votes: topVotes };
    }, [sorted]);

    if (!electionId) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>結果</h1>}
                actions={<Link to={backTo}>← 戻る</Link>}
            >
                <Card role="alert">Invalid electionId</Card>
            </Page>
        );
    }

    const title = data?.title ?? "結果";

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <Link
                        to={`/elections/${electionId}/candidates`}
                        state={{ from }}
                    >
                        候補者へ
                    </Link>

                    <button
                        onClick={load}
                        style={{ marginLeft: "auto" }}
                        disabled={isLoading}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
        >
            {/* 状態カード（エラー / 公開前） */}
            {error && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        {isForbidden ? "結果は未公開です" : "エラー"}
                    </div>

                    <div style={{ marginBottom: 10 }}>{error}</div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={load}>再試行</button>

                        <Link
                            to={`/elections/${electionId}/candidates`}
                            state={{ from }}
                        >
                            候補者へ
                        </Link>

                        <Link to={backTo}>戻る</Link>
                    </div>

                    {isForbidden && (
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                opacity: 0.85,
                                lineHeight: 1.6,
                            }}
                        >
                            ※
                            結果は「選挙が終了している」「結果公開フラグがON」などの条件で表示される想定
                        </div>
                    )}
                </Card>
            )}

            {/* Loading */}
            {!error && isLoading && <Card>読み込み中…</Card>}

            {/* Result */}
            {!error && !isLoading && data && (
                <Card>
                    <div style={{ display: "grid", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "baseline",
                            }}
                        >
                            <strong style={{ fontSize: 16 }}>
                                {data.title}
                            </strong>
                            <span style={{ opacity: 0.85 }}>
                                総投票数: <b>{data.totalVotes}</b>
                            </span>
                        </div>

                        {sorted.length === 0 ? (
                            <div
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    background: "#fafafa",
                                }}
                            >
                                結果データがありません。
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {sorted.map((r) => {
                                    const rank =
                                        ranks.get(r.candidateId) ?? null;
                                    const isTop =
                                        topRank?.votes != null &&
                                        r.votes === topRank.votes &&
                                        r.votes > 0;

                                    const ratioToTop =
                                        maxVotes > 0
                                            ? (r.votes / maxVotes) * 100
                                            : 0;
                                    const barW = clamp(ratioToTop, 2, 100);

                                    const p = percent(r.votes, data.totalVotes);

                                    return (
                                        <ResultRow
                                            key={r.candidateId}
                                            r={r}
                                            rank={rank}
                                            isTop={isTop}
                                            barW={barW}
                                            p={p}
                                            totalVotes={data.totalVotes}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <DevDebug
                value={{
                    electionId,
                    data,
                    error,
                    isForbidden,
                    isLoading,
                    backTo,
                    from,
                    sorted,
                    maxVotes,
                }}
            />
        </Page>
    );
}
