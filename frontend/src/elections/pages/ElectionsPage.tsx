import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchElections } from "../api/elections";
import type { ElectionListItem } from "../model/electionTypes";
import { useAuth } from "../../user/UserAuthContext";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";
import { ElectionListFilterBar } from "../ui/ElectionListFilterBar";
import { ElectionCardFrame } from "../ui/ElectionCardFrame";
import { useElectionListControls } from "../hooks/useElectionListControls";
import { filterSortElections } from "../model/electionListView";

function ElectionItemAction(props: {
    e: ElectionListItem;
    from: string;
    meExists: boolean;
}) {
    const { e, from, meExists } = props;

    const voteLink = `/voting/entry?electionId=${encodeURIComponent(e.electionId)}`;
    const resultLink = `/elections/result?electionId=${encodeURIComponent(e.electionId)}`;
    const publicVoteLink = `/voting/entry?electionId=${encodeURIComponent(e.electionId)}&session=public`;

    if (e.status === "ONGOING") {
        if (!meExists) {
            return (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link
                        to={publicVoteLink}
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        <b>本人認証で投票 →</b>
                    </Link>

                    <Link
                        to="/login"
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        ログインして投票 →
                    </Link>
                </div>
            );
        }

        if (e.canCast) {
            return (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link
                        to={voteLink}
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        <b>投票する →</b>
                    </Link>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <span style={{ opacity: 0.75 }}>
                    （ログイン投票は利用できません）
                </span>
                <Link
                    to="/identity/link"
                    state={{ from }}
                    style={{ textDecoration: "none" }}
                >
                    本人認証へ →
                </Link>
                <Link
                    to="/verify"
                    state={{ from }}
                    style={{ textDecoration: "none" }}
                >
                    メール認証へ →
                </Link>
            </div>
        );
    }

    if (e.status === "ENDED") {
        if (e.hasResult) {
            return (
                <Link
                    to={resultLink}
                    state={{ from }}
                    style={{ textDecoration: "none" }}
                >
                    結果を見る →
                </Link>
            );
        }
        return <span style={{ opacity: 0.6 }}>終了（結果未公開）</span>;
    }

    return <span style={{ opacity: 0.6 }}>開始前</span>;
}

function ElectionItemMeta({ e }: { e: ElectionListItem }) {
    const voted = !!(e as any).currentVote;

    return (
        <>
            <span>候補者数: {e.candidateCount}</span>

            {voted ? (
                <span>
                    現在の投票:{" "}
                    {(() => {
                        const cv = (e as any).currentVote;
                        if (!cv) return "なし";
                        if (cv.candidateName) return cv.candidateName;
                        if (!cv.candidateId) return "誰も支持しない";
                        return "投票済み";
                    })()}
                </span>
            ) : (
                <span style={{ opacity: 0.6 }}>現在の投票: なし</span>
            )}
        </>
    );
}

export function ElectionsPage() {
    const { me, isLoading: authLoading } = useAuth();

    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const {
        data: items,
        error,
        isLoading,
        run,
    } = useAsyncLoad<ElectionListItem[]>(fetchElections);

    const { controls, bind } = useElectionListControls();

    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(
        () => filterSortElections(items, controls),
        [items, controls],
    );

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>選挙一覧</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button onClick={run} disabled={isLoading}>
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>

                    {authLoading ? (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            認証確認中...
                        </span>
                    ) : !me ? (
                        <>
                            <span style={{ fontSize: 12, opacity: 0.75 }}>
                                ログインすると投票できます
                            </span>
                            <Link to="/login" state={{ from }}>
                                ログイン
                            </Link>
                        </>
                    ) : (
                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            ログイン中
                        </span>
                    )}
                </div>
            }
        >
            <ElectionListFilterBar {...bind} />

            {error && (
                <ErrorCard
                    message={error}
                    actions={<button onClick={run}>再試行</button>}
                />
            )}

            {filtered === null ? (
                <Card>読み込み中…</Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <p style={{ marginTop: 0, marginBottom: 6 }}>
                        選挙がありません
                    </p>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                        条件を変えるか、管理者に確認してください。
                    </p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filtered.map((e) => (
                        <ElectionCardFrame
                            key={e.electionId}
                            e={{
                                electionId: e.electionId,
                                title: e.title,
                                startsAt: e.startsAt,
                                endsAt: e.endsAt,
                                status: e.status,
                                hasResult: e.hasResult,
                            }}
                            from={from}
                            meta={<ElectionItemMeta e={e} />}
                            action={
                                <ElectionItemAction
                                    e={e}
                                    from={from}
                                    meExists={!!me}
                                />
                            }
                        />
                    ))}
                </div>
            )}

            <DevDebug
                value={{
                    items,
                    error,
                    isLoading,
                    filteredLen: filtered?.length ?? null,
                    controls,
                }}
            />
        </Page>
    );
}
