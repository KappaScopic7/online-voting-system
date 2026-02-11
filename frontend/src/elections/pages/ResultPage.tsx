import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchResultBundle } from "../api/elections";
import type { ElectionResultBundleResponse } from "../model/electionTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { CollapsibleFilter } from "../../shared/ui/CollapsibleFilter";
import { FilterBar } from "../../shared/ui/FilterBar";

import {
    clamp,
    percent,
    rankMap,
    toResultRows,
} from "../ui/result/resultUtils";
import { ResultRowCard } from "../ui/result/ResultRowCard";

type LocationState = { from?: string };

export function ResultPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;
    const [chartOk, setChartOk] = useState(true);
    const chartUrl = electionId ? `/api/elections/${electionId}/chart` : null;

    const backTo = normalizeFrom(state.from ?? "/elections");
    const from = loc.pathname + loc.search;

    const [isForbidden, setIsForbidden] = useState(false);

    const loadFn = async () => {
        if (!electionId) throw new Error("Invalid electionId");
        try {
            const res = await fetchResultBundle(electionId);
            setIsForbidden(false);
            return res;
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) setIsForbidden(true);
            throw err;
        }
    };

    const {
        data: bundle,
        error,
        isLoading,
        run: load,
        setError,
    } = useAsyncLoad<ElectionResultBundleResponse>(loadFn);

    useEffect(() => {
        if (!electionId) return;
        setChartOk(true);
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const { ballotType, isAlloc, title, rows, total, noneSupport } = useMemo(
        () => toResultRows(bundle),
        [bundle],
    );

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

    const [q, setQ] = useState("");

    const filteredRows = useMemo(() => {
        const key = q.trim().toLowerCase();
        if (!key) return rows;

        return rows.filter((r) => {
            const name = (
                (r as any).name ??
                (r as any).candidateName ??
                (r as any).displayName ??
                (r as any).title ??
                ""
            )
                .toString()
                .toLowerCase();

            return name.includes(key);
        });
    }, [rows, q]);

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

    const errorTitle = isForbidden ? "結果は未公開です" : "エラー";
    const errorMsg =
        error ??
        (isForbidden
            ? "この選挙はまだ結果を公開できません（未終了）"
            : "Failed to load result");

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
                        onClick={() => {
                            setError(null);
                            setIsForbidden(false);
                            setChartOk(true);
                            load();
                        }}
                        style={{ marginLeft: "auto" }}
                        disabled={isLoading}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
        >
            {error && (
                <ErrorCard
                    title={errorTitle}
                    message={errorMsg}
                    actions={
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setError(null);
                                    setIsForbidden(false);
                                    setChartOk(true);
                                    load();
                                }}
                            >
                                再試行
                            </button>
                            <Link
                                to={`/elections/${electionId}/candidates`}
                                state={{ from }}
                            >
                                候補者へ
                            </Link>
                            <Link to={backTo}>戻る</Link>
                        </div>
                    }
                />
            )}

            <CollapsibleFilter
                title="絞り込み"
                defaultOpen={!!q.trim()}
                right={
                    <span style={{ whiteSpace: "nowrap" }}>
                        表示 <b>{filteredRows.length}</b> 件
                    </span>
                }
            >
                <FilterBar
                    value={q}
                    onChange={setQ}
                    placeholder="検索（候補者名）"
                    disabled={isLoading || !!error}
                />
            </CollapsibleFilter>

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
                            {chartUrl && chartOk && (
                                <div
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 12,
                                        padding: 12,
                                        background: "#fafafa",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.75,
                                            marginBottom: 8,
                                        }}
                                    >
                                        集計グラフ（画像）
                                    </div>

                                    <img
                                        src={chartUrl}
                                        alt="集計グラフ"
                                        style={{
                                            width: "100%",
                                            borderRadius: 8,
                                            display: "block",
                                        }}
                                        loading="lazy"
                                        onError={() => setChartOk(false)} // ★404/403/失敗でフォールバックへ
                                    />

                                    <div
                                        style={{
                                            marginTop: 8,
                                            fontSize: 12,
                                            opacity: 0.7,
                                        }}
                                    >
                                        ※画像が無い場合は、下にテキスト結果を表示します
                                    </div>
                                </div>
                            )}

                            <span style={{ opacity: 0.85 }}>
                                {isAlloc ? (
                                    <>
                                        総ポイント: <b>{total}</b> /
                                        誰も支持しない: <b>{noneSupport}</b>
                                    </>
                                ) : (
                                    <>
                                        総投票数: <b>{total}</b> /
                                        誰も支持しない: <b>{noneSupport}</b>
                                    </>
                                )}
                            </span>
                        </div>

                        {!chartOk &&
                            (rows.length === 0 ? (
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
                                    {rows.map((r, idx) => {
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
                                            <ResultRowCard
                                                key={r.candidateId}
                                                electionId={electionId}
                                                from={from}
                                                r={r}
                                                rank={rank}
                                                isTop={isTop}
                                                barW={barW}
                                                p={p}
                                                total={total}
                                                unit={isAlloc ? "pt" : "票"}
                                                index={idx}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
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
