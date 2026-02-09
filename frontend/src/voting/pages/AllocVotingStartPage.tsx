// frontend/src/voting/pages/AllocVotingStartPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { allocConfirm, allocStart } from "../api/allocVoting";
import { publicAllocConfirm, publicAllocStart } from "../api/publicAllocVoting";
import type {
    AllocVoteConfirmRequest,
    AllocVoteStartResponse,
} from "../model/allocVotingTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { publicToken } from "../../shared/tokenStorage";

type LocationState = { from?: string } | null;

type Row = {
    type: "CANDIDATE" | "PARTY" | "NONE_SUPPORT";
    targetId: string | null;
    label: string;
    points: number;
};

function rowKey(r: Row): string {
    return `${r.type}:${r.targetId ?? "null"}`;
}
function isNone(r: Row) {
    return r.type === "NONE_SUPPORT";
}
function isCandidate(r: Row) {
    return r.type === "CANDIDATE";
}
function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function AllocVotingStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    // ✅ public モード判定：session=public / public=1 のみ
    const session = (sp.get("session") ?? "").toLowerCase();
    const publicMode = session === "public" || isTruthy(sp.get("public"));

    // ✅ token は publicMode のときだけ使う（混線防止）
    const tokenFromQuery = publicMode ? sp.get("token") : null;
    const effectiveToken = publicMode
        ? tokenFromQuery?.trim() || publicToken.get()
        : null;

    useEffect(() => {
        if (!publicMode) return;
        if (effectiveToken && effectiveToken.trim()) {
            publicToken.set(effectiveToken.trim());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicMode, effectiveToken]);

    const self = loc.pathname + loc.search;

    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );
    const doneQS = publicMode ? "?session=public" : "";

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [data, setData] = useState<AllocVoteStartResponse | null>(null);
    const [rows, setRows] = useState<Row[]>([]);

    const total = data?.pointsPerVoter ?? 0;

    const sum = useMemo(
        () => rows.reduce((a, r) => a + (Number(r.points) || 0), 0),
        [rows],
    );
    const rest = Math.max(0, total - sum);

    const noneIdx = useMemo(() => rows.findIndex((r) => isNone(r)), [rows]);
    const noneSelected = useMemo(() => {
        if (noneIdx < 0) return false;
        return (rows[noneIdx]?.points ?? 0) > 0;
    }, [rows, noneIdx]);

    const canSubmit =
        !!data &&
        sum === total &&
        rows.some((r) => (r.points ?? 0) > 0) &&
        !busy;
    const clampInt = (v: number) => Math.max(0, Math.floor(Number(v) || 0));

    const load = async () => {
        if (!electionId) return;

        setErr(null);
        setLoading(true);

        try {
            const res = publicMode
                ? await publicAllocStart(electionId)
                : await allocStart(electionId);

            setData(res);

            const normalized: Row[] = res.options.map((o) => ({
                type: o.type,
                targetId: o.targetId ?? null,
                label: o.label,
                points: 0,
            }));

            // NONE_SUPPORT は末尾に寄せる（見た目安定）
            const main = normalized.filter((r) => r.type !== "NONE_SUPPORT");
            const none = normalized.filter((r) => r.type === "NONE_SUPPORT");
            setRows([...main, ...none]);
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;

            if (status === 403) {
                setErr(
                    msg ??
                        "投票を開始できません（本人認証未完了 / 期間外 など）",
                );
            } else if (status === 401) {
                setErr(
                    msg ??
                        (publicMode
                            ? "本人認証の有効期限が切れました。もう一度本人認証してください。"
                            : "ログインが必要です"),
                );
            } else {
                setErr(msg ?? "取得に失敗しました");
            }

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
    }, [electionId, publicMode]);

    const commitNoneAll = () => {
        if (!data || busy) return;
        const ok = window.confirm(
            "「誰も支持しない」に全ポイントを入れます。\n（この場合、他の配分はすべて 0 になります）\n\n本当に実行しますか？",
        );
        if (!ok) return;

        setRows((prev) => {
            const nIdx = prev.findIndex((r) => isNone(r));
            if (nIdx < 0) return prev;
            return prev.map((r, i) =>
                i === nIdx ? { ...r, points: total } : { ...r, points: 0 },
            );
        });
    };

    const clearNone = () => {
        if (busy) return;
        setRows((prev) => {
            const nIdx = prev.findIndex((r) => isNone(r));
            if (nIdx < 0) return prev;
            return prev.map((r, i) => (i === nIdx ? { ...r, points: 0 } : r));
        });
    };

    const setPoints = (idx: number, v: number) => {
        if (!data || busy) return;

        setRows((prev) => {
            const next = prev.map((r) => ({ ...r }));

            // NONE_SUPPORT を選んでいたら解除
            const nIdx = next.findIndex((r) => isNone(r));
            if (nIdx >= 0 && (next[nIdx].points ?? 0) > 0) {
                next[nIdx].points = 0;
            }

            if (isNone(next[idx])) return next;

            next[idx].points = clampInt(v);

            const s = next.reduce((a, r) => a + (Number(r.points) || 0), 0);
            if (s > total) {
                const over = s - total;
                next[idx].points = Math.max(0, (next[idx].points ?? 0) - over);
            }
            return next;
        });
    };

    const fillRestTo = (idx: number) => {
        if (!data || busy) return;

        setRows((prev) => {
            const next = prev.map((r) => ({ ...r }));

            // NONE_SUPPORT を選んでいたら解除
            const nIdx = next.findIndex((r) => isNone(r));
            if (nIdx >= 0 && (next[nIdx].points ?? 0) > 0) {
                next[nIdx].points = 0;
            }

            if (isNone(next[idx])) return next;

            const s = next.reduce((a, r) => a + (Number(r.points) || 0), 0);
            const r = Math.max(0, total - s);
            next[idx].points = (next[idx].points ?? 0) + r;
            return next;
        });
    };

    const resetAll = () => {
        if (busy) return;
        setRows((prev) => prev.map((r) => ({ ...r, points: 0 })));
    };

    const onSubmit = async () => {
        if (!data || busy) return;

        setBusy(true);
        setErr(null);

        try {
            const req: AllocVoteConfirmRequest = {
                electionId: data.electionId,
                pointsTotal: total,
                items: rows
                    .filter((r) => (r.points ?? 0) > 0)
                    .map((r) => ({
                        type: r.type,
                        targetId: r.targetId,
                        points: r.points,
                    })),
            };

            const result = publicMode
                ? await publicAllocConfirm(req)
                : await allocConfirm(req);

            nav(`/alloc-voting/done${doneQS}`, {
                state: {
                    result,
                    from: backTo,
                    token: publicMode ? effectiveToken?.trim() || null : null,
                },
            });
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;

            if (status === 403) {
                setErr(msg ?? "投票できません（期間外/権限なし）");
            } else if (status === 401) {
                setErr(
                    msg ??
                        (publicMode
                            ? "本人認証の有効期限が切れました。もう一度本人認証してください。"
                            : "ログインが必要です"),
                );
            } else {
                setErr(msg ?? "送信に失敗しました");
            }
        } finally {
            setBusy(false);
        }
    };

    const title = data?.electionTitle
        ? `配分投票 / ${data.electionTitle}`
        : "配分投票";

    const hasCandidate = rows.some((r) => r.type === "CANDIDATE");

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
                        to={`/voting/entry?electionId=${encodeURIComponent(
                            electionId,
                        )}${publicMode ? "&session=public" : ""}${
                            effectiveToken
                                ? `&token=${encodeURIComponent(effectiveToken)}`
                                : ""
                        }`}
                        state={{ from: backTo }}
                    >
                        投票入口へ
                    </Link>

                    <button
                        onClick={load}
                        disabled={loading || busy || !electionId}
                        style={{ marginLeft: "auto" }}
                    >
                        {loading ? "読み込み中..." : "再読み込み"}
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

                        {publicMode && (
                            <Link
                                to={`/identity/vote?electionId=${encodeURIComponent(
                                    electionId,
                                )}&session=public&returnTo=${encodeURIComponent(
                                    self,
                                )}`}
                                state={{ from: backTo }}
                            >
                                本人認証（PIN+NFC）へ →
                            </Link>
                        )}

                        {!publicMode && (
                            <Link to="/me/identity" state={{ from: self }}>
                                本人認証へ
                            </Link>
                        )}

                        {!publicMode && (
                            <Link to="/verify" state={{ from: self }}>
                                メール認証へ
                            </Link>
                        )}

                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>
            )}

            {!err && loading && <Card>読み込み中…</Card>}

            {!err && !loading && data && (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 8 }}>
                            <strong style={{ fontSize: 16 }}>
                                {data.electionTitle}
                            </strong>

                            {publicMode && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    本人認証で投票しています（ログイン不要）
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "baseline",
                                }}
                            >
                                <div style={{ opacity: 0.85 }}>
                                    合計 <b>{total}</b>pt
                                    になるように配分してください。
                                </div>

                                <div
                                    style={{
                                        marginLeft: "auto",
                                        fontWeight: 800,
                                    }}
                                >
                                    合計: {sum}/{total}
                                    <span
                                        style={{
                                            marginLeft: 10,
                                            fontSize: 12,
                                            opacity: 0.75,
                                        }}
                                    >
                                        残り {rest}pt
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                <button onClick={resetAll} disabled={busy}>
                                    クリア
                                </button>

                                <span
                                    style={{
                                        marginLeft: "auto",
                                        fontSize: 12,
                                        opacity: 0.75,
                                    }}
                                >
                                    ※ 合計が一致しないと送信できません /
                                    期間内なら変更可能
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: "grid", gap: 10 }}>
                            {rows.map((r, idx) => {
                                const cand = isCandidate(r) && !!r.targetId;
                                const none = isNone(r);

                                if (none) {
                                    return (
                                        <div
                                            key={rowKey(r)}
                                            style={{
                                                border: "1px dashed #eee",
                                                borderRadius: 12,
                                                padding: 12,
                                                background: "#fafafa",
                                                display: "grid",
                                                gap: 10,
                                                marginTop: 8,
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
                                                <div
                                                    aria-hidden
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 999,
                                                        border: "1px solid #eee",
                                                        background: "#f7f7f7",
                                                    }}
                                                />

                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gap: 2,
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {r.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            opacity: 0.75,
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        ※
                                                        できるだけ候補者へ配分してください。
                                                        <br />※ 選択すると{" "}
                                                        {total}pt
                                                        を一括で消費します。
                                                    </div>
                                                </div>

                                                {noneSelected ? (
                                                    <button
                                                        type="button"
                                                        onClick={clearNone}
                                                        disabled={busy}
                                                    >
                                                        解除
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={commitNoneAll}
                                                        disabled={busy}
                                                    >
                                                        この選択をする…
                                                    </button>
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    alignItems: "baseline",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.75,
                                                    }}
                                                >
                                                    現在:
                                                </div>
                                                <div
                                                    style={{ fontWeight: 800 }}
                                                >
                                                    {r.points}pt
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={rowKey(r)}
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
                                                    {isCandidate(r)
                                                        ? "候補者"
                                                        : "政党"}
                                                </div>
                                            </div>

                                            {cand && (
                                                <Link
                                                    to={`/elections/${data.electionId}/candidates/${r.targetId}`}
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

                                            <button
                                                type="button"
                                                onClick={() => fillRestTo(idx)}
                                                disabled={busy || rest === 0}
                                                style={{ fontSize: 12 }}
                                                title="残りポイントをこの項目に追加します"
                                            >
                                                残りを入れる
                                            </button>

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
                            {hasCandidate && (
                                <Link
                                    to={`/elections/${data.electionId}/candidates`}
                                    state={{ from: self }}
                                >
                                    候補者を見る
                                </Link>
                            )}

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
                    rest,
                    noneSelected,
                    err,
                    loading,
                    busy,
                    backTo,
                    self,
                    state,
                    publicMode,
                    session,
                    tokenFromQuery: tokenFromQuery ? "(present)" : null,
                    effectiveToken: effectiveToken ? "(present)" : null,
                    hasStoredPublicToken: !!publicToken.get(),
                }}
            />
        </Page>
    );
}
