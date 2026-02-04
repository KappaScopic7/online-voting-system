// frontend/src/elections/pages/ResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchResultBundle } from "../api/elections";
import type { ElectionResultBundleResponse } from "../model/electionTypes";
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

function rankMap(
    rows: { candidateId: string; value: number }[],
): Map<string, number> {
    const map = new Map<string, number>();
    let rank = 0;
    let prev: number | null = null;
    for (let i = 0; i < rows.length; i++) {
        const v = rows[i].value;
        if (prev === null || v !== prev) {
            rank = i + 1;
            prev = v;
        }
        map.set(rows[i].candidateId, rank);
    }
    return map;
}

function ResultRow({
    r,
    rank,
    isTop,
    barW,
    p,
    total,
    unit,
}: {
    r: { candidateId: string; candidateName: string; value: number };
    rank: number | null;
    isTop: boolean;
    barW: number;
    p: string;
    total: number;
    unit: string; // "票" | "pt"
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
                    <b>{r.value}</b> {unit}（{p}）
                </span>
            </div>

            <div
                role="progressbar"
                aria-label={`${r.candidateName} の割合`}
                aria-valuenow={total > 0 ? (r.value / total) * 100 : 0}
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
                    value: r.value,
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

    const [bundle, setBundle] = useState<ElectionResultBundleResponse | null>(
        null,
    );

    const [error, setError] = useState<string | null>(null);
    const [isForbidden, setIsForbidden] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        if (!electionId) return;

        setError(null);
        setIsForbidden(false);
        setIsLoading(true);

        try {
            const res = await fetchResultBundle(electionId);
            setBundle(res);
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setIsForbidden(true);
                setError(msg ?? "この選挙はまだ結果を公開できません（未終了）");
            } else {
                setError(msg ?? "Failed to load result");
            }
            setBundle(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const ballotType = (bundle?.ballotType ?? "SINGLE_CHOICE")
        .toString()
        .toUpperCase();

    const isAlloc = ballotType === "ALLOCATION";

    const title =
        (isAlloc ? bundle?.alloc?.title : bundle?.normal?.title) ?? "結果";

    const rows = useMemo(() => {
        if (!bundle) return [];
        if (isAlloc) {
            const a = bundle.alloc;
            if (!a) return [];
            return [...a.results]
                .map((r) => ({
                    candidateId: r.candidateId,
                    candidateName: r.candidateName,
                    value: r.points,
                }))
                .sort((x, y) => y.value - x.value);
        } else {
            const n = bundle.normal;
            if (!n) return [];
            return [...n.results]
                .map((r) => ({
                    candidateId: r.candidateId,
                    candidateName: r.candidateName,
                    value: r.votes,
                }))
                .sort((x, y) => y.value - x.value);
        }
    }, [bundle, ballotType]);

    const total = useMemo(() => {
        if (!bundle) return 0;
        if (isAlloc) return bundle.alloc?.totalPoints ?? 0;
        return bundle.normal?.totalVotes ?? 0;
    }, [bundle, ballotType]);

    const maxValue = useMemo(
        () => rows.reduce((m, x) => Math.max(m, x.value), 0),
        [rows],
    );

    const ranks = useMemo(
        () =>
            rankMap(
                rows.map((r) => ({
                    candidateId: r.candidateId,
                    value: r.value,
                })),
            ),
        [rows],
    );

    const topValue = useMemo(() => {
        if (rows.length === 0) return null;
        const v = rows[0].value;
        if (v <= 0) return null;
        return v;
    }, [rows]);

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
                </Card>
            )}

            {!error && isLoading && <Card>読み込み中…</Card>}

            {!error && !isLoading && bundle && (
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
                            <strong style={{ fontSize: 16 }}>{title}</strong>

                            {!isAlloc ? (
                                <span style={{ opacity: 0.85 }}>
                                    総投票数:{" "}
                                    <b>{bundle.normal?.totalVotes ?? 0}</b>
                                </span>
                            ) : (
                                <span style={{ opacity: 0.85 }}>
                                    総ポイント:{" "}
                                    <b>{bundle.alloc?.totalPoints ?? 0}</b> /
                                    誰も支持しない:{" "}
                                    <b>
                                        {bundle.alloc?.noneSupportPoints ?? 0}
                                    </b>
                                </span>
                            )}
                        </div>

                        {rows.length === 0 ? (
                            <div
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    background: "#fafafa",
                                }}
                            >
                                結果データがありません。
                                <div
                                    style={{
                                        marginTop: 8,
                                        fontSize: 12,
                                        opacity: 0.8,
                                    }}
                                >
                                    {isAlloc
                                        ? "alloc が null か results が空です（APIの返却を確認）"
                                        : "normal が null か results が空です（APIの返却を確認）"}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {rows.map((r) => {
                                    const rank =
                                        ranks.get(r.candidateId) ?? null;
                                    const isTop =
                                        topValue != null &&
                                        r.value === topValue &&
                                        r.value > 0;

                                    const barW = clamp(
                                        maxValue > 0
                                            ? (r.value / maxValue) * 100
                                            : 0,
                                        2,
                                        100,
                                    );
                                    const p = percent(r.value, total);

                                    return (
                                        <ResultRow
                                            key={r.candidateId}
                                            r={r}
                                            rank={rank}
                                            isTop={isTop}
                                            barW={barW}
                                            p={p}
                                            total={total}
                                            unit={isAlloc ? "pt" : "票"}
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
                    ballotType,
                    isAlloc,
                    bundle,
                    error,
                    isForbidden,
                    isLoading,
                    backTo,
                    from,
                    rowsLen: rows.length,
                    maxValue,
                    total,
                }}
            />
        </Page>
    );
}
