// frontend/src/elections/pages/ElectionDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchElectionDetail } from "../api/elections";
import type { ElectionDetailResponse } from "../model/electionTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { useAuth } from "../../user/UserAuthContext";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { formatJST, statusLabel } from "../../shared/elections/format";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

type LocationState = { from?: string };

function fmt(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function resolveCandidateName(
    candidateId: string | null | undefined,
    candidates: { id: string; name: string }[],
): string {
    if (!candidateId) return "誰も支持しない";
    const hit = candidates.find((c) => c.id === candidateId);
    return hit?.name ?? candidateId;
}

export function ElectionDetailPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const loc = useLocation();
    const nav = useNavigate();
    const { me, isLoading: authLoading } = useAuth();

    const state = (loc.state ?? {}) as LocationState;
    const backTo = normalizeFrom(state.from ?? "/elections");
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

    const canStartVote = useMemo(() => {
        if (!data) return false;
        return data.canCast && data.status === "ONGOING";
    }, [data]);

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>
                    {data?.title ?? "選挙詳細"}
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
                    {electionId ? (
                        <>
                            <Link
                                to={`/elections/${electionId}/candidates`}
                                state={{ from: self }}
                            >
                                候補者へ
                            </Link>
                            <Link
                                to={`/elections/${electionId}/result`}
                                state={{ from: self }}
                            >
                                結果へ
                            </Link>
                        </>
                    ) : null}
                </div>
            }
        >
            {loading && <Card>読み込み中…</Card>}

            {!loading && err && (
                <Card role="alert">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ color: "crimson" }}>{err}</div>
                </Card>
            )}

            {!loading && !err && !data && <Card>Not found</Card>}

            {!loading && !err && data && (
                <>
                    <Card>
                        <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ opacity: 0.9 }}>
                                状態: <b>{statusLabel(data.status as any)}</b>
                            </div>
                            <div style={{ opacity: 0.9 }}>
                                期間: {formatJST(data.startsAt)} 〜{" "}
                                {formatJST(data.endsAt)}
                            </div>
                            <div style={{ opacity: 0.9 }}>
                                候補者数: <b>{data.candidateCount}</b>
                            </div>
                        </div>
                    </Card>

                    {data.currentVote && (
                        <Card>
                            <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontWeight: 800 }}>
                                    現在の投票
                                </div>
                                <div>
                                    {data.currentVote.candidateName ??
                                        resolveCandidateName(
                                            data.currentVote.candidateId,
                                            data.candidates,
                                        )}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.8 }}>
                                    castedAt: {fmt(data.currentVote.castedAt)}
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card>
                        <div style={{ marginBottom: 10, fontWeight: 800 }}>
                            候補者
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                            {data.candidates.map((c) => {
                                const candidateKey =
                                    typeof (c as any)?.candidateKey === "string"
                                        ? ((c as any).candidateKey as string)
                                        : null;

                                const imageUrl =
                                    typeof (c as any)?.imageUrl === "string"
                                        ? ((c as any).imageUrl as string)
                                        : null;

                                return (
                                    <Link
                                        key={c.id}
                                        to={`/elections/${data.electionId}/candidates/${c.id}`}
                                        state={{ from: self }}
                                        style={{
                                            textDecoration: "none",
                                            color: "inherit",
                                        }}
                                    >
                                        <div
                                            style={{
                                                border: "1px solid #eee",
                                                borderRadius: 12,
                                                padding: 12,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                background: "#fff",
                                            }}
                                        >
                                            <CandidateAvatar
                                                name={c.name}
                                                imageUrl={imageUrl}
                                                candidateKey={candidateKey}
                                                // indexは渡さない（並び順依存を排除）
                                                size={48}
                                            />

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 12,
                                                    flex: 1,
                                                    alignItems: "center",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 650,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {c.name}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.6,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </Card>

                    <Card>
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
                                }}
                            >
                                <Link to="/login" state={{ from: self }}>
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
                                        onClick={() => {
                                            nav(
                                                `/voting/start?electionId=${data.electionId}`,
                                                {
                                                    state: { from: self },
                                                },
                                            );
                                        }}
                                    >
                                        投票を開始
                                    </button>

                                    <button
                                        disabled={!canStartVote}
                                        onClick={() => {
                                            nav(
                                                `/alloc-voting/start?electionId=${data.electionId}`,
                                                {
                                                    state: { from: self },
                                                },
                                            );
                                        }}
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
                    </Card>
                </>
            )}

            <DevDebug
                value={{ electionId, data, err, loading, backTo, self }}
            />
        </Page>
    );
}
