// frontend/src/voting/pages/VotingDonePage.tsx
import { Link, useLocation } from "react-router-dom";
import type { VoteHistoryItem } from "../api/votes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

function formatJST(iso?: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
}

function EmptyAvatar({ size }: { size: number }) {
    return (
        <div
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: 999,
                border: "1px solid #eee",
                background: "#fafafa",
            }}
        />
    );
}

type DoneState = { result?: VoteHistoryItem; from?: string } | null;

export function VotingDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const result = state?.result ?? null;
    const backTo = normalizeFrom(state?.from ?? "/me/elections");

    if (!result) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>投票完了</h1>}
                actions={<Link to={backTo}>← 戻る</Link>}
                maxWidth={720}
            >
                <Card role="alert">
                    <p style={{ marginTop: 0 }}>
                        投票結果が見つかりません（ページを直接開いた可能性があります）
                    </p>
                    <p style={{ marginBottom: 0, fontSize: 13, opacity: 0.8 }}>
                        投票履歴から直近の投票を確認してください。
                    </p>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/me/votes">投票履歴へ</Link>
                        <Link to="/elections">選挙一覧へ</Link>
                        <Link to="/me">マイページへ</Link>
                    </div>
                </Card>

                <DevDebug value={{ state, loc }} />
            </Page>
        );
    }

    const self = loc.pathname + loc.search;

    const isCandidate = result.type === "CANDIDATE" && !!result.candidateId;

    const displayName =
        result.candidateName ?? (isCandidate ? "(unknown)" : "誰も支持しない");

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>投票が完了しました</h1>
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

                    <Link
                        to={`/elections/${result.electionId}/result`}
                        state={{ from: self }}
                    >
                        結果
                    </Link>
                </div>
            }
            maxWidth={720}
        >
            <Card>
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
                            {result.electionTitle}
                        </strong>
                        <span style={{ opacity: 0.8 }}>
                            {formatJST(result.castedAt)}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {isCandidate ? (
                            <CandidateAvatar
                                name={displayName}
                                imageUrl={null}
                                index={0}
                                size={34}
                            />
                        ) : (
                            <EmptyAvatar size={34} />
                        )}

                        <div>
                            投票先:{" "}
                            {isCandidate ? (
                                <Link
                                    to={`/elections/${result.electionId}/candidates/${result.candidateId}`}
                                    state={{ from: self }}
                                    style={{
                                        color: "inherit",
                                        textDecoration: "none",
                                        fontWeight: 800,
                                    }}
                                    title="候補者詳細へ"
                                >
                                    {displayName}
                                </Link>
                            ) : (
                                <strong>{displayName}</strong>
                            )}
                            {!isCandidate && (
                                <span
                                    style={{
                                        marginLeft: 8,
                                        fontSize: 12,
                                        opacity: 0.7,
                                    }}
                                >
                                    （候補者を選ばない）
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※
                        投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                    </div>
                </div>
            </Card>

            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to="/me/votes">
                        <b>投票履歴を見る</b>
                    </Link>

                    <Link
                        to={`/elections/${result.electionId}/candidates`}
                        state={{ from: self }}
                    >
                        候補者（公開）
                    </Link>

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
            </Card>

            <DevDebug value={{ result, state, backTo, self, isCandidate }} />
        </Page>
    );
}
