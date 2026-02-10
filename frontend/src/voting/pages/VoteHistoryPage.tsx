import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Card, DevDebug, Page } from "../../shared/ui/page";
import { FilterBar } from "../../shared/ui/FilterBar";

import { VoteRow } from "../ui/voteHistory/VoteRow";
import { AllocRow } from "../ui/voteHistory/AllocRow";
import { formatJST } from "../ui/voteHistory/formatJST";
import {
    isJudgeReviewOnly,
    normalChangeLink,
    normalSectionTitle,
} from "../domain/voteHistory/voteHistoryLogic";

import { useVoteHistoryPageState } from "./hooks/useVoteHistoryPageState";

import { buildVoteHistoryGroups } from "../domain/voteHistory/buildVoteHistoryGroups";
import { filterVoteHistoryGroups } from "../domain/voteHistory/filterVoteHistoryGroups";

import {
    EmailGuideCard,
    IdentityGuideCard,
    LoginRequiredCard,
} from "../ui/voteHistory/VoteHistoryGuides";

export function VoteHistoryPage() {
    const isDev = import.meta.env?.DEV;

    const vm = useVoteHistoryPageState();

    const groups = useMemo(
        () => buildVoteHistoryGroups(vm.normalItems, vm.allocItems),
        [vm.normalItems, vm.allocItems],
    );

    const filteredGroups = useMemo(
        () => filterVoteHistoryGroups(groups, vm.q, vm.mode),
        [groups, vm.q, vm.mode],
    );

    const totalGroups = groups.length;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>投票履歴</h1>}
            actions={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to={vm.backTo}>← 戻る</Link>
                    <button
                        onClick={vm.load}
                        disabled={vm.isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {vm.isLoading ? "読み込み中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={920}
        >
            <LoginRequiredCard
                from={vm.from}
                me={vm.me}
                meError={vm.meError}
                isDev={isDev}
            />

            <EmailGuideCard
                show={vm.showEmailGuide}
                email={vm.me?.email}
                from={vm.from}
            />

            <IdentityGuideCard
                show={vm.showIdentityGuide}
                isPending={vm.isPending}
                from={vm.from}
            />

            {/* モード切替 */}
            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: 12, opacity: 0.75 }}>表示:</span>

                    <button
                        type="button"
                        onClick={() => vm.setMode("ALL")}
                        disabled={vm.isLoading}
                        style={{ fontWeight: vm.mode === "ALL" ? 800 : 400 }}
                    >
                        すべて
                    </button>

                    <button
                        type="button"
                        onClick={() => vm.setMode("NORMAL")}
                        disabled={vm.isLoading}
                        style={{ fontWeight: vm.mode === "NORMAL" ? 800 : 400 }}
                    >
                        通常（候補者・国民審査）
                    </button>

                    <button
                        type="button"
                        onClick={() => vm.setMode("ALLOC")}
                        disabled={vm.isLoading}
                        style={{ fontWeight: vm.mode === "ALLOC" ? 800 : 400 }}
                    >
                        配分
                    </button>

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.75,
                        }}
                    >
                        通常（候補者・国民審査） <b>{vm.totalNormal}</b>
                        {" / "}
                        配分 <b>{vm.totalAlloc}</b>
                    </span>
                </div>
            </Card>

            <FilterBar
                value={vm.q}
                onChange={vm.setQ}
                placeholder="検索（選挙名 / 投票先 / 配分項目）"
                disabled={vm.isLoading}
                right={
                    <span>
                        合計 <b>{vm.totalVotes}</b> 件（<b>{totalGroups}</b>{" "}
                        選挙）
                    </span>
                }
            />

            {vm.error && (
                <Card role="alert">
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontWeight: 800 }}>エラー</div>
                            <div style={{ opacity: 0.9 }}>{vm.error}</div>
                        </div>
                        <button
                            onClick={vm.load}
                            style={{ marginLeft: "auto" }}
                        >
                            再試行
                        </button>
                    </div>
                </Card>
            )}

            {!vm.ready ? (
                <Card>読み込み中…</Card>
            ) : vm.totalVotes === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>投票履歴はありません</p>
                    {vm.me !== null && !vm.isLinked && (
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: 12,
                                opacity: 0.75,
                            }}
                        >
                            ※
                            本人認証が未完了の場合、履歴が取得できないことがあります。
                        </p>
                    )}
                </Card>
            ) : filteredGroups.length === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>該当する履歴が見つかりません</p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filteredGroups.map((g, gi) => {
                        const latestAt = g.latestAt ?? "";
                        const latestStatus = g.latestStatus ?? "";
                        const latestIsOngoing = latestStatus === "ONGOING";

                        return (
                            <Card key={g.electionId}>
                                <div style={{ display: "grid", gap: 10 }}>
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
                                            <Link
                                                to={`/elections/${g.electionId}`}
                                                state={{ from: vm.from }}
                                            >
                                                {g.electionTitle}
                                            </Link>
                                        </strong>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        最新: {formatJST(latestAt)}
                                        {latestStatus ? (
                                            <span
                                                style={{
                                                    marginLeft: 10,
                                                    opacity: 0.75,
                                                }}
                                            >
                                                status: {latestStatus}
                                            </span>
                                        ) : null}
                                    </div>

                                    {g.method === "NORMAL" &&
                                        g.normal.length > 0 && (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 900,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {normalSectionTitle(
                                                        g.normal,
                                                    )}
                                                </div>
                                                {g.normal.map((v) => (
                                                    <VoteRow
                                                        key={
                                                            v.voteId ||
                                                            v.castedAt
                                                        }
                                                        v={v}
                                                        from={vm.from}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                    {g.method === "ALLOC" &&
                                        g.alloc.length > 0 && (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 900,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    配分投票
                                                </div>
                                                {g.alloc.map((v, vi) => (
                                                    <AllocRow
                                                        key={v.castId}
                                                        v={v}
                                                        from={vm.from}
                                                        indexOffset={
                                                            gi * 1000 + vi * 20
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Link
                                            to={`/elections/${g.electionId}/candidates`}
                                            state={{ from: vm.from }}
                                        >
                                            候補者（公開）
                                        </Link>
                                        <Link
                                            to={`/elections/${g.electionId}/result`}
                                            state={{ from: vm.from }}
                                        >
                                            結果
                                        </Link>

                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                display: "flex",
                                                gap: 12,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {latestIsOngoing ? (
                                                <>
                                                    {g.method === "NORMAL" && (
                                                        <Link
                                                            to={normalChangeLink(
                                                                g.electionId,
                                                                isJudgeReviewOnly(
                                                                    g.normal,
                                                                ),
                                                            )}
                                                            state={{
                                                                from: vm.from,
                                                            }}
                                                        >
                                                            <b>投票を変更 →</b>
                                                        </Link>
                                                    )}
                                                    {g.method === "ALLOC" && (
                                                        <Link
                                                            to={`/alloc-voting/start?electionId=${encodeURIComponent(g.electionId)}`}
                                                            state={{
                                                                from: vm.from,
                                                            }}
                                                        >
                                                            <b>投票を変更 →</b>
                                                        </Link>
                                                    )}
                                                </>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.6,
                                                    }}
                                                >
                                                    投票期間終了
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.65 }}
                                    >
                                        ※
                                        結果が未公開の場合、結果ページで「未公開」表示になります。
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {isDev && (
                <DevDebug
                    value={{
                        me: vm.me,
                        meError: vm.meError,
                        normalLen: vm.normalItems?.length ?? null,
                        allocLen: vm.allocItems?.length ?? null,
                        error: vm.error,
                        groupsLen: groups.length,
                        filteredGroupsLen: filteredGroups.length,
                        backTo: vm.backTo,
                        from: vm.from,
                        q: vm.q,
                        mode: vm.mode,
                        isLoading: vm.isLoading,
                    }}
                />
            )}
        </Page>
    );
}
