import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchMyElections } from "../api/meElections";
import type { ElectionListItem } from "../model/electionTypes";
import {
    fetchMeEligibility,
    type MeEligibilityResponse,
} from "../../me/api/eligibility";

import { Card, DevDebug, Page } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useAsyncLoad } from "../../shared/hooks/useAsyncLoad";

import { ElectionListFilterBar } from "../ui/ElectionListFilterBar";
import { ElectionCardFrame } from "../ui/ElectionCardFrame";
import { useElectionListControls } from "../hooks/useElectionListControls";
import { filterSortElections } from "../model/electionListView";
import { CollapsibleFilter } from "../../shared/ui/CollapsibleFilter";

function EligibilityBadge({ elig }: { elig: MeEligibilityResponse | null }) {
    if (!elig) return null;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #eee",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                background: "#fafafa",
                opacity: 0.95,
                whiteSpace: "nowrap",
            }}
            title="投票可能な選挙を判定するための情報"
        >
            判定: <b>{elig.source}</b>
            {elig.cityCode ? (
                <>
                    / cityCode: <b>{elig.cityCode}</b>
                </>
            ) : null}
        </span>
    );
}

function MyElectionItemMeta({ e }: { e: ElectionListItem }) {
    const voted = !!e.hasCurrent;

    return (
        <>
            {voted ? (
                <span style={{ opacity: 0.9 }}>現在の投票: あり</span>
            ) : (
                <span style={{ opacity: 0.6 }}>現在の投票: なし</span>
            )}

            {e.hasResult ? (
                <span style={{ opacity: 0.85 }}>結果: あり</span>
            ) : (
                <span style={{ opacity: 0.5 }}>結果: なし</span>
            )}
        </>
    );
}

function MyElectionItemAction(props: { e: ElectionListItem; from: string }) {
    const { e, from } = props;

    const voteLink = `/voting/entry?electionId=${encodeURIComponent(e.electionId)}`;
    const resultLink = `/elections/result?electionId=${encodeURIComponent(e.electionId)}`;

    if (e.status === "ONGOING") {
        // ★方式共通：投票済み判定は hasCurrent
        const voted = !!e.hasCurrent;

        // // 通常投票だけ currentVote が入るので、表示できる時だけラベルを出す
        // const label = e.currentVote
        //     ? (e.currentVote.candidateName ??
        //       (e.currentVote.candidateId ? "投票済み" : "誰も支持しない"))
        //     : null;

        // 投票可能なら「投票する/変更する」
        if (e.canCast) {
            return (
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link
                        to={voteLink}
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        <b>{voted ? "投票を変更する →" : "投票する →"}</b>
                    </Link>
                </div>
            );
        }

        // canCast=false の場合は本人認証/メール認証導線
        return (
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <span style={{ opacity: 0.75 }}>（投票できません）</span>
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

export function MyElectionsPage() {
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const loadFn = async () => {
        const [elections, eligibility] = await Promise.all([
            fetchMyElections(),
            fetchMeEligibility(),
        ]);
        return { elections, eligibility };
    };

    const {
        data,
        error: err,
        isLoading: loading,
        run: reload,
    } = useAsyncLoad(loadFn);

    const items = (data?.elections ?? null) as ElectionListItem[] | null;
    const elig = (data?.eligibility ?? null) as MeEligibilityResponse | null;

    const { controls, bind } = useElectionListControls();

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showHint = elig?.source === "NONE" || !elig?.cityCode;

    const filtered = useMemo(() => {
        const list = filterSortElections(items as any, controls);
        if (list === null) return null;

        const ongoing: ElectionListItem[] = [];
        const upcoming: ElectionListItem[] = [];
        const ended: ElectionListItem[] = [];

        for (const e of list as ElectionListItem[]) {
            if (e.status === "ONGOING") ongoing.push(e);
            else if (e.status === "ENDED") ended.push(e);
            else upcoming.push(e);
        }

        // ★未投票優先は hasCurrent で判定（方式共通）
        const splitByVoted = (xs: ElectionListItem[]) => {
            const notVoted: ElectionListItem[] = [];
            const voted: ElectionListItem[] = [];
            for (const e of xs) {
                const has = !!e.hasCurrent;
                (has ? voted : notVoted).push(e);
            }
            return [...notVoted, ...voted];
        };

        return [...splitByVoted(ongoing), ...upcoming, ...ended];
    }, [items, controls]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>My選挙</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button onClick={reload} disabled={loading}>
                        {loading ? "Reloading..." : "再読み込み"}
                    </button>

                    <EligibilityBadge elig={elig} />

                    <Link to="/me" style={{ marginLeft: "auto" }}>
                        マイページ →
                    </Link>
                </div>
            }
            maxWidth={900}
        >
            {showHint && (
                <Card>
                    <div
                        style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}
                    >
                        {elig?.source === "NONE"
                            ? "判定に使える情報がありません（本人認証 or プロフィール入力が必要）"
                            : "cityCode が未設定です（本人認証 or プロフィール入力で設定してください）"}
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/me/identity" state={{ from }}>
                            本人確認へ →
                        </Link>
                        <Link to="/me/profile" state={{ from }}>
                            プロフィールへ →
                        </Link>
                    </div>
                </Card>
            )}

            {err && (
                <ErrorCard
                    message={err}
                    actions={<button onClick={reload}>再試行</button>}
                />
            )}

            <CollapsibleFilter
                title="絞り込み"
                defaultOpen={false}
                right={
                    <span style={{ whiteSpace: "nowrap" }}>
                        表示 <b>{filtered?.length ?? 0}</b> 件
                    </span>
                }
            >
                <ElectionListFilterBar {...bind} />
            </CollapsibleFilter>

            {filtered === null ? (
                <Card>読み込み中…</Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <p style={{ marginTop: 0, marginBottom: 6 }}>
                        該当する選挙がありません
                    </p>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
                        rule の cityCode/minAge と、判定ソースの cityCode
                        が一致しているか確認してね。
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
                            meta={<MyElectionItemMeta e={e} />}
                            action={<MyElectionItemAction e={e} from={from} />}
                        />
                    ))}
                </div>
            )}

            <DevDebug
                value={{
                    items,
                    elig,
                    err,
                    loading,
                    from,
                    filteredLen: filtered?.length ?? null,
                    controls,
                }}
            />
        </Page>
    );
}
