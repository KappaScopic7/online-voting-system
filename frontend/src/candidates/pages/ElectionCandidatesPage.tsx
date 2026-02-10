import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchElectionCandidates } from "../api/candidates";
import type { CandidateItem } from "../model/candidateTypes";
import { Page, Card, DevDebug } from "../../shared/ui/page";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { CandidateCard } from "../ui/CandidateCard";

export function ElectionCandidatesPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const { self: from, backTo } = useFromBackTo("/elections");

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

    const hasCandidates = useMemo(
        () => items !== null && items.length > 0,
        [items],
    );

    const isDev = import.meta.env?.DEV;

    if (!electionId) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>候補者一覧</h1>}
                actions={<Link to="/elections">← 戻る</Link>}
                maxWidth={860}
            >
                <ErrorCard message="Invalid electionId" />
            </Page>
        );
    }

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>候補者一覧</h1>}
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
                        to={`/elections/${electionId}/result`}
                        state={{ from }}
                    >
                        結果ページへ →
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
            maxWidth={860}
        >
            {isDev && (
                <Card>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        electionId: {electionId}
                    </div>
                </Card>
            )}

            {error && (
                <ErrorCard
                    message={error}
                    actions={<button onClick={load}>再試行</button>}
                />
            )}

            {items === null ? (
                <Card>読み込み中…</Card>
            ) : items.length === 0 ? (
                <Card>
                    <p style={{ marginTop: 0 }}>候補者がいません</p>
                    <p style={{ marginBottom: 0, opacity: 0.8, fontSize: 13 }}>
                        候補者が登録されていないため、この選挙は投票できません（想定）。
                    </p>
                </Card>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        alignItems: "stretch",
                    }}
                >
                    {items.map((c, idx) => (
                        <CandidateCard
                            key={c.id}
                            c={c}
                            from={from}
                            detailUrl={`/elections/${electionId}/candidates/${c.id}`}
                            showId={isDev}
                            showSortOrder={false}
                            indexOverride={idx}
                        />
                    ))}
                </div>
            )}

            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        to={`/voting/start?electionId=${encodeURIComponent(electionId)}`}
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
                        ※本人認証やメール認証が必要な場合は投票画面で誘導されます
                    </span>
                </div>
            </Card>

            <DevDebug
                value={{ electionId, items, error, isLoading, backTo, from }}
            />
        </Page>
    );
}
