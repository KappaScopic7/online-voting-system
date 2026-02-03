// frontend/src/voting/pages/AllocVotingDonePage.tsx
import { Link, useLocation } from "react-router-dom";
import type { AllocVoteHistoryItem } from "../model/allocVotingTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";

type DoneState = { result?: AllocVoteHistoryItem; from?: string } | null;

export function AllocVotingDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const result = state?.result ?? null;
    const backTo = normalizeFrom(state?.from ?? "/me/elections");

    if (!result) {
        return (
            <Page
                title={
                    <h1 style={{ margin: 0, fontSize: 20 }}>
                        投票完了（配分投票）
                    </h1>
                }
                actions={<Link to={backTo}>← 戻る</Link>}
                maxWidth={860}
            >
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        投票結果がありません
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        ページを直接開いた可能性があります。履歴から確認してください。
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/me/alloc-votes">履歴へ</Link>
                        <Link to="/elections">選挙一覧へ</Link>
                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>

                <DevDebug value={{ state, loc }} />
            </Page>
        );
    }

    const self = loc.pathname + loc.search;

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>
                    投票が完了しました（配分投票）
                </h1>
            }
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <Link
                        to={`/elections/${result.electionId}`}
                        state={{ from: self }}
                    >
                        選挙詳細
                    </Link>

                    {/* 結果は入口へ統一 */}
                    <Link
                        to={`/elections/result?electionId=${result.electionId}`}
                        state={{ from: self }}
                    >
                        結果
                    </Link>
                </div>
            }
            maxWidth={860}
        >
            <Card>
                <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ fontSize: 16 }}>
                        {result.electionTitle}
                    </strong>

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※
                        投票は期間内であれば変更できます（最後に送信した内容が有効）
                    </div>
                </div>
            </Card>

            <Card>
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>配分内容</div>

                    <div
                        style={{
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 12,
                        }}
                    >
                        {result.items.map((it, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "6px 0",
                                    borderBottom:
                                        i === result.items.length - 1
                                            ? "none"
                                            : "1px solid #f1f1f1",
                                }}
                            >
                                <div>{it.label}</div>
                                <div>
                                    <b>{it.points}</b>pt
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Link to="/me/alloc-votes">
                            <b>履歴を見る</b>
                        </Link>

                        {/* 投票変更は入口へ統一 */}
                        <Link
                            to={`/voting/entry?electionId=${result.electionId}`}
                            state={{ from: backTo }}
                        >
                            <b>投票を変更する →</b>
                        </Link>

                        <span
                            style={{
                                marginLeft: "auto",
                                display: "inline-flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <Link to="/elections">選挙一覧へ</Link>
                            <Link to={backTo}>My選挙へ</Link>
                        </span>
                    </div>
                </div>
            </Card>

            <DevDebug value={{ result, state, backTo, self }} />
        </Page>
    );
}
