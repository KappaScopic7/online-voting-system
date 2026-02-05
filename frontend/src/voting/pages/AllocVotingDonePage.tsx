// frontend/src/voting/pages/AllocVotingStartPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { allocConfirm, allocStart } from "../api/allocVoting";
import type {
    AllocVoteConfirmRequest,
    AllocVoteStartResponse,
} from "../model/allocVotingTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

type LocationState = { from?: string } | null;

type Row = {
    type: "CANDIDATE" | "NONE_SUPPORT";
    candidateId: string | null;
    label: string;
    points: number;
};

export function AllocVotingStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    const self = loc.pathname + loc.search;
    const backTo = normalizeFrom(state?.from ?? "/me/elections");

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<AllocVoteStartResponse | null>(null);

    const [rows, setRows] = useState<Row[]>([]);
    const sum = useMemo(
        () => rows.reduce((a, r) => a + (Number(r.points) || 0), 0),
        [rows],
    );

    const canSubmit =
        !!data &&
        sum === data.pointsPerVoter &&
        rows.some((r) => (r.points ?? 0) > 0) &&
        !busy;

    const load = async () => {
        if (!electionId) return;
        setErr(null);
        setLoading(true);
        try {
            const res = await allocStart(electionId);
            setData(res);
            setRows(
                res.options.map(
                    (o, idx) => ({ ...o, points: 0, _idx: idx }) as any,
                ),
            );
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "取得に失敗しました");
            setData(null);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!electionId) {
            setErr("electionId が不正です");
            setLoading(false);
            return;
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const setPoints = (idx: number, v: number) => {
        setRows((prev) =>
            prev.map((r, i) =>
                i === idx
                    ? { ...r, points: Math.max(0, Math.floor(v || 0)) }
                    : r,
            ),
        );
    };

    const onSubmit = async () => {
        if (!data || busy) return;

        const req: AllocVoteConfirmRequest = {
            electionId: data.electionId,
            pointsTotal: data.pointsPerVoter,
            items: rows
                .filter((r) => (r.points ?? 0) > 0)
                .map((r) => ({
                    type: r.type,
                    candidateId: r.candidateId,
                    points: r.points,
                })),
        };

        setBusy(true);
        setErr(null);
        try {
            const result = await allocConfirm(req);

            nav("/alloc-voting/done", {
                state: {
                    result,
                    from: backTo,
                },
            });
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "送信に失敗しました");
        } finally {
            setBusy(false);
        }
    };

    const title = data?.electionTitle
        ? `配分投票 / ${data.electionTitle}`
        : "配分投票";

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <Link
                        to={`/voting/entry?electionId=${electionId}`}
                        state={{ from: backTo }}
                    >
                        投票入口へ
                    </Link>

                    <button
                        onClick={load}
                        disabled={loading || busy || !electionId}
                        style={{ marginLeft: "auto" }}
                    >
                        {loading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={860}
        >
            {!electionId && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div>electionId がありません</div>
                    <div style={{ marginTop: 10 }}>
                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>
            )}

            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ marginBottom: 10 }}>{err}</div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={load} disabled={loading || busy}>
                            再試行
                        </button>

                        <Link to="/identity/link" state={{ from: self }}>
                            本人認証へ
                        </Link>
                        <Link to="/verify" state={{ from: self }}>
                            メール認証へ
                        </Link>

                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>
            )}

            {!err && loading && <Card>読み込み中…</Card>}

            {!err && !loading && data && (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 6 }}>
                            <strong style={{ fontSize: 16 }}>
                                {data.electionTitle}
                            </strong>
                            <div style={{ opacity: 0.85 }}>
                                合計 <b>{data.pointsPerVoter}</b>pt
                                になるように配分してください。
                            </div>
                            <div style={{ fontWeight: 800 }}>
                                合計: {sum}/{data.pointsPerVoter}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    opacity: 0.75,
                                    lineHeight: 1.6,
                                }}
                            >
                                ※ 合計が一致しないと送信できません
                                <br />※
                                送信後、投票履歴に記録されます（期間内なら変更可能）
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            {rows.map((r, idx) => {
                                const isCandidate =
                                    r.type === "CANDIDATE" && !!r.candidateId;

                                return (
                                    <div
                                        key={`${r.type}-${r.candidateId ?? "none"}`}
                                        style={{
                                            border: "1px solid #eee",
                                            borderRadius: 12,
                                            padding: 12,
                                            background: "#fff",
                                            display: "grid",
                                            gap: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 10,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <CandidateAvatar
                                                name={r.label}
                                                imageUrl={null}
                                                index={idx}
                                                size={40}
                                            />

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 2,
                                                    flex: 1,
                                                }}
                                            >
                                                <div
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    {r.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.7,
                                                    }}
                                                >
                                                    {r.type === "NONE_SUPPORT"
                                                        ? "（誰も支持しない）"
                                                        : "候補者"}
                                                </div>
                                            </div>

                                            {isCandidate && (
                                                <Link
                                                    to={`/elections/${data.electionId}/candidates/${r.candidateId}`}
                                                    state={{ from: self }}
                                                    style={{ fontSize: 13 }}
                                                >
                                                    詳細 →
                                                </Link>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <input
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={r.points}
                                                onChange={(e) =>
                                                    setPoints(
                                                        idx,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                style={{ width: 140 }}
                                                disabled={busy}
                                            />
                                            <span>pt</span>

                                            <span
                                                style={{
                                                    marginLeft: "auto",
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                現在: <b>{r.points}</b>pt
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            style={{
                                marginTop: 12,
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <Link
                                to={`/elections/${data.electionId}/candidates`}
                                state={{ from: self }}
                            >
                                候補者（公開）を見る
                            </Link>

                            <span
                                style={{
                                    marginLeft: "auto",
                                    display: "inline-flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link to={backTo}>戻る</Link>

                                <button
                                    disabled={!canSubmit}
                                    onClick={onSubmit}
                                >
                                    {busy ? "送信中..." : "この内容で投票する"}
                                </button>
                            </span>
                        </div>
                    </Card>
                </div>
            )}

            <DevDebug
                value={{
                    electionId,
                    data,
                    rows,
                    sum,
                    err,
                    loading,
                    busy,
                    backTo,
                    self,
                    state,
                }}
            />
        </Page>
    );
}
