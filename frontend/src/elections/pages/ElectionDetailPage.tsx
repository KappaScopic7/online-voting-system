// frontend/src/elections/pages/ElectionDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchElectionDetail } from "../api/elections";
import type { ElectionDetailResponse } from "../model/electionTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { useAuth } from "../../user/UserAuthContext";

type LocationState = { from?: string };

function fmt(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function resolveCandidateName(
    candidateId: string,
    candidates: { id: string; name: string }[],
): string {
    const hit = candidates.find((c) => c.id === candidateId);
    return hit?.name ?? candidateId;
}

export function ElectionDetailPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const loc = useLocation();
    const nav = useNavigate();
    const { me, isLoading: authLoading } = useAuth();

    const state = (loc.state ?? {}) as LocationState;

    // 「戻る」先：遷移元が渡してくれた from を最優先。無ければ安全に /elections
    const backTo = normalizeFrom(state.from ?? "/elections");

    // 「ログイン」「投票開始」へ渡す from：この詳細ページ自身
    const self = loc.pathname + loc.search;

    const [data, setData] = useState<ElectionDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!electionId) {
            setErr("electionId が不正です");
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setErr(null);

        fetchElectionDetail(electionId)
            .then((d) => {
                if (!cancelled) setData(d);
            })
            .catch((e) => {
                // axios の場合は e.response.data.message がある
                const apiMsg = e?.response?.data?.message;
                if (!cancelled) setErr(apiMsg ?? String(e?.message ?? e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [electionId]);

    if (loading) return <div>Loading...</div>;

    if (err) {
        return (
            <div style={{ padding: 12, display: "grid", gap: 12 }}>
                <div>
                    <Link to={backTo}>← 戻る</Link>
                </div>
                <div style={{ color: "crimson" }}>Error: {err}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 12, display: "grid", gap: 12 }}>
                <div>
                    <Link to={backTo}>← 戻る</Link>
                </div>
                <div>Not found</div>
            </div>
        );
    }

    const canStartVote = data.canCast && data.status === "ONGOING";

    return (
        <div style={{ padding: 12, display: "grid", gap: 16 }}>
            <div>
                <Link to={backTo}>← 戻る</Link>
            </div>

            <div>
                <h2 style={{ margin: 0 }}>{data.title}</h2>
                <div>status: {data.status}</div>
                <div>
                    期間: {fmt(data.startsAt)} 〜 {fmt(data.endsAt)}
                </div>
                <div>候補者数: {data.candidateCount}</div>
            </div>

            {data.currentVote && (
                <div
                    style={{
                        border: "1px solid #ddd",
                        padding: 12,
                        borderRadius: 8,
                    }}
                >
                    <div>
                        <b>現在の投票</b>
                    </div>
                    <div>
                        {data.currentVote.candidateName ??
                            resolveCandidateName(
                                data.currentVote.candidateId,
                                data.candidates,
                            )}
                    </div>

                    <div>castedAt: {fmt(data.currentVote.castedAt)}</div>
                </div>
            )}

            <div
                style={{
                    border: "1px solid #ddd",
                    padding: 12,
                    borderRadius: 8,
                }}
            >
                <div style={{ marginBottom: 8 }}>
                    <b>候補者</b>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                    {data.candidates.map((c) => (
                        <Link
                            key={c.id}
                            to={`/elections/${data.electionId}/candidates/${c.id}`}
                            state={{ from: self }}
                            style={{
                                border: "1px solid #eee",
                                padding: 10,
                                borderRadius: 8,
                                textDecoration: "none",
                                color: "inherit",
                                display: "block",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <span>{c.name}</span>
                                <span style={{ fontSize: 12, opacity: 0.6 }}>
                                    →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
                {authLoading ? (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        認証確認中...
                    </div>
                ) : !me ? (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/login" state={{ from: self }}>
                            ログインして投票
                        </Link>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            ログイン後、この詳細に戻ります
                        </span>
                    </div>
                ) : (
                    <>
                        <button
                            disabled={!canStartVote}
                            onClick={() => {
                                nav(
                                    `/voting/start?electionId=${data.electionId}`,
                                    { state: { from: self } },
                                );
                            }}
                        >
                            投票を開始
                        </button>

                        {!canStartVote && (
                            <div
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    marginTop: 2,
                                }}
                            >
                                投票開始できません（本人認証未完了 / 期間外
                                など）
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
