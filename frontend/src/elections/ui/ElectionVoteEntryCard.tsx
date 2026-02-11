// frontend/src/elections/ui/ElectionVoteEntryCard.tsx
import { Link } from "react-router-dom";
import { Card } from "../../shared/ui/page";
import type { ElectionDetailResponse } from "../model/electionTypes";

export function ElectionVoteEntryCard(props: {
    data: ElectionDetailResponse;
    electionId: string;
    from: string;

    // ✅ 型未整備ならこれでOK（存在判定だけに使う）
    me: unknown | null;
    authLoading: boolean;
}) {
    const { data, electionId, from, me, authLoading } = props;

    const isOngoing = data.status === "ONGOING";
    const canPublicVote = isOngoing && !!electionId;

    // ✅ ログイン投票は VotingEntryPage に寄せて NORMAL/ALLOC を振り分けさせる
    const loginEntryLink = `/voting/entry?electionId=${encodeURIComponent(
        electionId,
    )}`;

    // ✅ 本人認証投票も VotingEntryPage に寄せる（token無ければ /identity/vote に送られる）
    // const publicEntryLink = `/voting/entry?electionId=${encodeURIComponent(
    //     electionId,
    // )}&session=public`;

    return (
        <Card>
            <div style={{ display: "grid", gap: 10 }}>
                {/* --- 本人認証投票（未ログインでも可） --- */}
                {canPublicVote ? (
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        {/* <Link
                            to={publicEntryLink}
                            state={{ from }}
                            style={{ textDecoration: "none", fontWeight: 700 }}
                        >
                            本人認証して投票 →
                        </Link> */}

                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            PIN（4桁）+ NFC/手入力で投票できます
                        </span>
                    </div>
                ) : (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        本人認証投票は開催中のみ利用できます
                    </div>
                )}

                <hr style={{ border: "none", borderTop: "1px solid #eee" }} />

                {/* --- ログイン投票（既存） --- */}
                {authLoading ? (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        認証確認中...
                    </div>
                ) : !me ? (
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Link to="/login" state={{ from }}>
                            ログインして投票 →
                        </Link>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            ログイン後、この詳細に戻ります
                        </span>
                    </div>
                ) : (
                    <>
                        {/* 開催中 & 投票可能なら開始リンク */}
                        {isOngoing && data.canCast ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                <Link
                                    to={loginEntryLink}
                                    state={{ from }}
                                    style={{ textDecoration: "none" }}
                                >
                                    <b>投票を開始 →</b>
                                </Link>

                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    ※ 配分投票か通常投票かは自動で振り分けます
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                {!isOngoing ? (
                                    <span
                                        style={{ fontSize: 12, opacity: 0.7 }}
                                    >
                                        投票は開催中のみ開始できます
                                    </span>
                                ) : (
                                    <>
                                        <span style={{ opacity: 0.75 }}>
                                            （投票できません）
                                        </span>
                                        <Link
                                            to="/identity/link"
                                            state={{ from }}
                                            style={{ textDecoration: "none" }}
                                        >
                                            本人認証へ →
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
