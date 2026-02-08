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

type DoneState = {
    result?: VoteHistoryItem;
    from?: string;

    // result が無いケース（public配分や直リンクなど）でも最低限の遷移ができるように
    electionId?: string;
    electionTitle?: string;
} | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function VotingDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const q = new URLSearchParams(loc.search);
    const session = (q.get("session") ?? "").toLowerCase();
    const isPublic = session === "public" || isTruthy(q.get("public"));

    const result = state?.result ?? null;

    const electionId =
        result?.electionId ?? state?.electionId ?? q.get("electionId") ?? "";
    const electionTitle =
        result?.electionTitle ??
        state?.electionTitle ??
        (isPublic ? "投票（本人認証）" : "投票");

    const defaultBack = isPublic ? "/elections" : "/me/elections";
    const backTo = normalizeFrom(state?.from ?? defaultBack);

    const self = loc.pathname + loc.search;

    const entryLink = electionId
        ? `/voting/entry?electionId=${encodeURIComponent(electionId)}${
              isPublic ? "&session=public" : ""
          }`
        : isPublic
          ? "/elections"
          : "/me/elections";

    const eid = encodeURIComponent(electionId);
    const electionDetailLink = electionId ? `/elections/${eid}` : "/elections";
    const resultLink = electionId ? `/elections/${eid}/result` : "/elections";

    // result が無い場合でも「完了画面」として成立させる（public配分や直リンク対策）
    if (!result) {
        return (
            <Page
                title={
                    <h1 style={{ margin: 0, fontSize: 20 }}>
                        投票が完了しました
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
                        <Link to={electionDetailLink} state={{ from: self }}>
                            選挙詳細
                        </Link>
                        <Link to={resultLink} state={{ from: self }}>
                            結果
                        </Link>
                    </div>
                }
                maxWidth={720}
            >
                <Card>
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>{electionTitle}</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            投票は送信されました。
                            {isPublic ? "（本人認証投票）" : ""}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.75,
                                lineHeight: 1.6,
                            }}
                        >
                            ※
                            ページを直接開いた/更新した場合、投票内容（候補者名）は表示できないことがあります。
                            <br />※
                            投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                                marginTop: 6,
                            }}
                        >
                            <Link to={entryLink}>
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
                                {!isPublic && (
                                    <Link to="/me/votes">投票履歴へ</Link>
                                )}
                                {!isPublic && (
                                    <Link to="/me">マイページへ</Link>
                                )}
                                <Link to={backTo}>戻る</Link>
                            </span>
                        </div>
                    </div>
                </Card>

                <DevDebug
                    value={{
                        isPublic,
                        session,
                        state,
                        loc,
                        electionId,
                        electionTitle,
                        backTo,
                        entryLink,
                    }}
                />
            </Page>
        );
    }

    // result がある場合は従来どおり詳細表示
    const isCandidate = !!result.candidateId;
    const displayName =
        result.candidateName ?? (isCandidate ? "(unknown)" : "誰も支持しない");
    const rid = encodeURIComponent(result.electionId);

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

                    <Link to={`/elections/${rid}`} state={{ from: self }}>
                        選挙詳細
                    </Link>

                    <Link
                        to={`/elections/${rid}/result`}
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

                    {isPublic && (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                            本人認証で投票しています（ログイン不要）
                        </div>
                    )}

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
                    {!isPublic && (
                        <Link to="/me/votes">
                            <b>投票履歴を見る</b>
                        </Link>
                    )}

                    <Link
                        to={`/elections/${result.electionId}/candidates`}
                        state={{ from: self }}
                    >
                        候補者（公開）
                    </Link>

                    <Link to={entryLink} state={{ from: backTo }}>
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
                        {!isPublic && <Link to={backTo}>My選挙へ</Link>}
                        {isPublic && <Link to={backTo}>戻る</Link>}
                    </span>
                </div>
            </Card>

            <DevDebug
                value={{
                    isPublic,
                    session,
                    result,
                    state,
                    backTo,
                    self,
                    isCandidate,
                    entryLink,
                }}
            />
        </Page>
    );
}
