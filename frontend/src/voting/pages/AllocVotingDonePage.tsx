// frontend/src/voting/pages/AllocVotingDonePage.tsx
import { Link, useLocation } from "react-router-dom";
import type { AllocVoteHistoryItem } from "../model/allocVotingTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

type DoneState = {
    result?: AllocVoteHistoryItem;
    from?: string;

    electionId?: string;
    electionTitle?: string;

    // ✅ public の token を Done -> Entry へ引き回すため
    token?: string | null;
} | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function AllocVotingDonePage() {
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
        (isPublic ? "配分投票（本人認証）" : "配分投票");

    const defaultBack = isPublic ? "/elections" : "/me/elections";
    const backTo = normalizeFrom(state?.from ?? defaultBack);

    const self = loc.pathname + loc.search;

    const tokenFromState = (state?.token ?? "").trim();

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

    if (!result) {
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
                        <Link to={electionDetailLink} state={{ from: self }}>
                            選挙詳細
                        </Link>
                        <Link to={resultLink} state={{ from: self }}>
                            結果
                        </Link>
                    </div>
                }
                maxWidth={860}
            >
                <Card>
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>{electionTitle}</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            配分投票は送信されました。
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
                            ページを直接開いた/更新した場合、配分内訳は表示できないことがあります。
                            <br />※
                            投票は期間内であれば変更できます（最後に送信した内容が有効）
                        </div>

                        <div
                            style={{
                                marginTop: 6,
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
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
                                    <Link to="/me/votes">履歴へ</Link>
                                )}
                                {!isPublic && <Link to={backTo}>My選挙へ</Link>}
                                {isPublic && <Link to={backTo}>戻る</Link>}
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
                        tokenFromState: tokenFromState ? "(present)" : null,
                    }}
                />
            </Page>
        );
    }

    const rid = encodeURIComponent(result.electionId);

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
            maxWidth={860}
        >
            <Card>
                <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ fontSize: 16 }}>
                        {result.electionTitle}
                    </strong>

                    {isPublic && (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                            本人認証（NFC / アプリ）で投票中
                        </div>
                    )}

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
                        {result.items.map((it, i) => {
                            const isCandidate =
                                it.type === "CANDIDATE" && !!it.targetId;

                            const labelNode = isCandidate ? (
                                <Link
                                    to={`/elections/${result.electionId}/candidates/${it.targetId}`}
                                    state={{ from: self }}
                                    style={{
                                        color: "inherit",
                                        textDecoration: "none",
                                    }}
                                    title="候補者詳細へ"
                                >
                                    {it.label}
                                </Link>
                            ) : (
                                <span>{it.label}</span>
                            );

                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "8px 0",
                                        borderBottom:
                                            i === result.items.length - 1
                                                ? "none"
                                                : "1px solid #f1f1f1",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "center",
                                            minWidth: 0,
                                        }}
                                    >
                                        <CandidateAvatar
                                            name={it.label}
                                            imageUrl={null}
                                            index={i}
                                            size={30}
                                            mode={
                                                isCandidate
                                                    ? "AUTO"
                                                    : "SILHOUETTE"
                                            }
                                        />
                                        <div
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {labelNode}
                                        </div>
                                    </div>

                                    <div style={{ whiteSpace: "nowrap" }}>
                                        <b>{it.points}</b>pt
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        {!isPublic && (
                            <Link to="/me/votes">
                                <b>履歴を見る</b>
                            </Link>
                        )}

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
                    entryLink,
                    tokenFromState: tokenFromState ? "(present)" : null,
                }}
            />
        </Page>
    );
}
