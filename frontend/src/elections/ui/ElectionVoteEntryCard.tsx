// frontend/src/elections/ui/ElectionVoteEntryCard.tsx
import { Link, useNavigate } from "react-router-dom";
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
    const nav = useNavigate();

    const canStartVote = data.canCast && data.status === "ONGOING";

    // 公開投票: canCastに依存させない（本人認証側で弾く）
    const canPublicVote = data.status === "ONGOING" && !!electionId;
    const publicEntryLink = `/public/voting/${encodeURIComponent(electionId)}`;

    return (
        <Card>
            <div style={{ display: "grid", gap: 10 }}>
                {/* --- 公開投票（未ログインでも可） --- */}
                {canPublicVote ? (
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Link
                            to={publicEntryLink}
                            state={{ from }}
                            style={{ textDecoration: "none", fontWeight: 700 }}
                        >
                            本人認証して投票 →
                        </Link>

                        <span style={{ fontSize: 12, opacity: 0.75 }}>
                            NFC / アプリから投票できます
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
                            ログインして投票
                        </Link>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            ログイン後、この詳細に戻ります
                        </span>
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                disabled={!canStartVote}
                                onClick={() =>
                                    nav(
                                        `/voting/start?electionId=${data.electionId}`,
                                        { state: { from } },
                                    )
                                }
                            >
                                投票を開始
                            </button>

                            <button
                                disabled={!canStartVote}
                                onClick={() =>
                                    nav(
                                        `/alloc-voting/start?electionId=${data.electionId}`,
                                        { state: { from } },
                                    )
                                }
                            >
                                配分投票を開始
                            </button>
                        </div>

                        {!canStartVote && (
                            <div
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    marginTop: 6,
                                }}
                            >
                                投票開始できません（本人認証未完了 /
                                期間外など）
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
