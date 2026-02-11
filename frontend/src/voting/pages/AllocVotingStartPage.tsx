// frontend/src/voting/pages/AllocVotingStartPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
    useOutletContext,
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

import { CandidateCardFrame } from "../../candidates/ui/CandidateCardFrame";
import { PartyPill } from "../../parties/ui/PartyPill";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

// ★プロジェクトに合わせて import を調整
import { fetchElectionCandidates } from "../../candidates/api/candidates";
import { fetchParties } from "../../parties/api/parties";
import type { PartyListItem } from "../../parties/model/partyTypes";

import type {
    PublicLayoutOutletContext,
    FooterAction,
} from "../../layout/public/PublicLayout";

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
function isParty(r: Row) {
    return r.type === "PARTY";
}
function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

type CandidateMeta = {
    candidateId: string;
    candidateKey?: string | null;
    imageUrl?: string | null;
    title?: string | null;
    party?: {
        id?: string | null;
        partyKey?: string | null;
        shortName?: string | null;
        name?: string | null;
        color?: string | null;
    } | null;
};

type Step = "EDIT" | "CONFIRM";

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

    // ✅ footer bar
    const { setFooterActions } = useOutletContext<PublicLayoutOutletContext>();

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
    const [step, setStep] = useState<Step>("EDIT");

    // ★メタ（政党色/画像）
    const [candMetaById, setCandMetaById] = useState<
        Record<string, CandidateMeta>
    >({});
    const [partyByAnyKey, setPartyByAnyKey] = useState<
        Record<string, PartyListItem>
    >({});

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

    const hasAnyPoints = rows.some((r) => (r.points ?? 0) > 0);
    const canGoConfirm =
        !!data && sum === total && hasAnyPoints && !busy && !loading && !err;

    const canSubmit =
        step === "CONFIRM" && !!data && sum === total && hasAnyPoints && !busy;

    const clampInt = (v: number) => Math.max(0, Math.floor(Number(v) || 0));

    const load = useCallback(async () => {
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

            setStep("EDIT");

            // ★追加ロード：候補者 / 政党 メタ（失敗しても投票は続行）
            try {
                const [candsRaw, parties] = await Promise.all([
                    fetchElectionCandidates(electionId),
                    fetchParties(),
                ]);

                // party lookup（id / partyKey どちらでも引けるように）
                const pMap: Record<string, PartyListItem> = {};
                for (const p of parties ?? []) {
                    if ((p as any)?.id) pMap[String((p as any).id)] = p;
                    if ((p as any)?.partyKey)
                        pMap[String((p as any).partyKey)] = p;
                }
                setPartyByAnyKey(pMap);

                const cMap: Record<string, CandidateMeta> = {};
                for (const c of (candsRaw as any[]) ?? []) {
                    const cid = String(
                        (c as any)?.id ?? (c as any)?.candidateId,
                    );
                    if (!cid) continue;
                    const party = (c as any)?.party ?? null;

                    cMap[cid] = {
                        candidateId: cid,
                        candidateKey: (c as any)?.candidateKey ?? null,
                        imageUrl: (c as any)?.imageUrl ?? null,
                        title: (c as any)?.title ?? null,
                        party: party
                            ? {
                                  id: party?.id ?? null,
                                  partyKey: party?.partyKey ?? null,
                                  shortName: party?.shortName ?? null,
                                  name: party?.name ?? null,
                                  color: party?.color ?? null,
                              }
                            : null,
                    };
                }
                setCandMetaById(cMap);
            } catch {
                setPartyByAnyKey({});
                setCandMetaById({});
            }
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
            setPartyByAnyKey({});
            setCandMetaById({});
            setStep("EDIT");
        } finally {
            setLoading(false);
        }
    }, [electionId, publicMode]);

    useEffect(() => {
        if (!electionId) {
            setErr("electionId が不正です");
            setLoading(false);
            return;
        }
        load();
    }, [electionId, publicMode, load]);

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

    const resolveRowParty = (r: Row) => {
        if (isCandidate(r) && r.targetId) {
            const m = candMetaById[r.targetId] ?? null;
            return m?.party ?? null;
        }
        if (isParty(r) && r.targetId) {
            const p = partyByAnyKey[r.targetId] ?? null;
            return p
                ? {
                      id: (p as any).id,
                      partyKey: (p as any).partyKey,
                      shortName: (p as any).shortName,
                      name: (p as any).name,
                      color: (p as any).color,
                  }
                : null;
        }
        return null;
    };

    const onGoConfirm = useCallback(() => {
        if (!canGoConfirm) return;
        setErr(null);
        setStep("CONFIRM");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [canGoConfirm]);

    const onBackToEdit = useCallback(() => {
        if (busy) return;
        setErr(null);
        setStep("EDIT");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [busy]);

    const onSubmit = useCallback(async () => {
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

            // 送信失敗時は EDIT に戻す（修正導線）
            setStep("EDIT");
        } finally {
            setBusy(false);
        }
    }, [
        data,
        busy,
        total,
        rows,
        publicMode,
        doneQS,
        nav,
        backTo,
        effectiveToken,
    ]);

    // ✅ footer actions（VotingStartPage と同じノリ）
    useEffect(() => {
        const actions: FooterAction[] = [];

        // 左：戻る（CONFIRMならEDITへ戻す、EDITなら backTo）
        if (step === "CONFIRM") {
            actions.push({
                kind: "BUTTON",
                label: "戻る",
                disabled: busy,
                onClick: onBackToEdit,
            });
        } else {
            actions.push({ kind: "LINK", to: backTo, label: "戻る" });
        }

        // 右：メイン操作
        if (err) {
            actions.push({
                kind: "BUTTON",
                label: loading ? "読み込み中..." : "再試行",
                disabled: loading || busy || !electionId,
                onClick: load,
            });
        } else if (step === "EDIT") {
            actions.push({
                kind: "BUTTON",
                label: "次へ（内容確認）",
                disabled: !canGoConfirm,
                onClick: onGoConfirm,
            });
        } else {
            actions.push({
                kind: "BUTTON",
                label: busy ? "送信中..." : "この内容で投票する",
                disabled: !canSubmit,
                onClick: onSubmit,
            });
        }

        setFooterActions(actions);
        return () => setFooterActions(null);
    }, [
        setFooterActions,
        step,
        busy,
        err,
        loading,
        electionId,
        load,
        backTo,
        canGoConfirm,
        canSubmit,
        onGoConfirm,
        onBackToEdit,
        onSubmit,
    ]);

    const title = data?.electionTitle
        ? `配分投票 / ${data.electionTitle}`
        : "配分投票";

    const hasCandidate = rows.some((r) => r.type === "CANDIDATE");

    const isDev = import.meta.env?.DEV;

    const chosenItems = useMemo(() => {
        return rows
            .filter((r) => (r.points ?? 0) > 0)
            .map((r) => {
                const party = resolveRowParty(r);
                return { ...r, party };
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, candMetaById, partyByAnyKey]);

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
                    {/* ヘッダ */}
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
                                <button
                                    onClick={() => {
                                        if (step === "CONFIRM") return;
                                        resetAll();
                                    }}
                                    disabled={busy || step === "CONFIRM"}
                                >
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

                    {/* 本体 */}
                    {step === "EDIT" ? (
                        <Card>
                            <div style={{ display: "grid", gap: 10 }}>
                                {rows.map((r, idx) => {
                                    const cand = isCandidate(r) && !!r.targetId;
                                    const none = isNone(r);

                                    const party = resolveRowParty(r);
                                    const partyColor =
                                        (party?.color ?? "").trim() || null;

                                    const candMeta =
                                        cand && r.targetId
                                            ? (candMetaById[r.targetId] ?? null)
                                            : null;

                                    const candidateKey =
                                        (candMeta?.candidateKey ?? "").trim() ||
                                        null;

                                    const imgSrc =
                                        cand && r.targetId
                                            ? (resolveCandidateImageUrl(
                                                  candidateKey ?? undefined,
                                              ) ??
                                              candMeta?.imageUrl ??
                                              null)
                                            : null;

                                    const detailHref =
                                        cand && r.targetId
                                            ? `/elections/${encodeURIComponent(
                                                  data.electionId,
                                              )}/candidates/${encodeURIComponent(
                                                  r.targetId,
                                              )}`
                                            : null;

                                    if (none) {
                                        return (
                                            <div key={rowKey(r)}>
                                                <CandidateCardFrame
                                                    partyColor={null}
                                                >
                                                    <div
                                                        style={{
                                                            border: "1px dashed #eee",
                                                            borderRadius: 10,
                                                            padding: 12,
                                                            background:
                                                                "#fafafa",
                                                            display: "grid",
                                                            gap: 10,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 10,
                                                                alignItems:
                                                                    "center",
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >
                                                            <div
                                                                aria-hidden
                                                                style={{
                                                                    width: 44,
                                                                    height: 44,
                                                                    borderRadius: 999,
                                                                    border: "1px solid #eee",
                                                                    background:
                                                                        "#f7f7f7",
                                                                }}
                                                            />

                                                            <div
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gap: 2,
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontWeight: 800,
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
                                                                    <br />※
                                                                    選択すると{" "}
                                                                    {total}pt
                                                                    を一括で消費します。
                                                                </div>
                                                            </div>

                                                            {noneSelected ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        clearNone
                                                                    }
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                >
                                                                    解除
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        commitNoneAll
                                                                    }
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                >
                                                                    この選択をする…
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                                alignItems:
                                                                    "baseline",
                                                                flexWrap:
                                                                    "wrap",
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
                                                                style={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {r.points}pt
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CandidateCardFrame>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={rowKey(r)}>
                                            <CandidateCardFrame
                                                partyColor={partyColor}
                                            >
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gap: 10,
                                                        background: "#fff",
                                                        borderRadius: 12,
                                                        transition:
                                                            "background 120ms ease",
                                                    }}
                                                    onMouseEnter={(ev) => {
                                                        (
                                                            ev.currentTarget as HTMLDivElement
                                                        ).style.background =
                                                            "#fafafa";
                                                    }}
                                                    onMouseLeave={(ev) => {
                                                        (
                                                            ev.currentTarget as HTMLDivElement
                                                        ).style.background =
                                                            "#fff";
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 10,
                                                            alignItems:
                                                                "center",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <CandidateAvatar
                                                            name={r.label}
                                                            imageUrl={imgSrc}
                                                            candidateKey={
                                                                candidateKey ??
                                                                undefined
                                                            }
                                                            index={idx}
                                                            size={44}
                                                        />

                                                        <div
                                                            style={{
                                                                display: "grid",
                                                                gap: 4,
                                                                flex: 1,
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    gap: 10,
                                                                    alignItems:
                                                                        "baseline",
                                                                    flexWrap:
                                                                        "wrap",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontWeight: 800,
                                                                        overflow:
                                                                            "hidden",
                                                                        textOverflow:
                                                                            "ellipsis",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                    }}
                                                                >
                                                                    {r.label}
                                                                </div>

                                                                {party?.shortName ||
                                                                party?.name ? (
                                                                    <PartyPill
                                                                        shortName={
                                                                            party?.shortName ??
                                                                            ""
                                                                        }
                                                                        name={
                                                                            party?.name ??
                                                                            party?.shortName ??
                                                                            ""
                                                                        }
                                                                        color={
                                                                            partyColor ??
                                                                            ""
                                                                        }
                                                                    />
                                                                ) : null}

                                                                <span
                                                                    style={{
                                                                        marginLeft:
                                                                            "auto",
                                                                        fontSize: 12,
                                                                        opacity: 0.7,
                                                                    }}
                                                                >
                                                                    {cand
                                                                        ? "候補者"
                                                                        : "政党"}
                                                                </span>
                                                            </div>

                                                            {candMeta?.title ? (
                                                                <div
                                                                    style={{
                                                                        fontSize: 13,
                                                                        opacity: 0.85,
                                                                        lineHeight: 1.5,
                                                                    }}
                                                                >
                                                                    {
                                                                        candMeta.title
                                                                    }
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {detailHref ? (
                                                            <Link
                                                                to={detailHref}
                                                                state={{
                                                                    from: self,
                                                                }}
                                                                style={{
                                                                    fontSize: 13,
                                                                }}
                                                            >
                                                                詳細 →
                                                            </Link>
                                                        ) : null}
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 8,
                                                            alignItems:
                                                                "center",
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
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: 140,
                                                            }}
                                                            disabled={busy}
                                                        />
                                                        <span>pt</span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                fillRestTo(idx)
                                                            }
                                                            disabled={
                                                                busy ||
                                                                rest === 0
                                                            }
                                                            style={{
                                                                fontSize: 12,
                                                            }}
                                                            title="残りポイントをこの項目に追加します"
                                                        >
                                                            残りを入れる
                                                        </button>

                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    "auto",
                                                                fontSize: 12,
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            現在:{" "}
                                                            <b>{r.points}</b>pt
                                                        </span>
                                                    </div>
                                                </div>
                                            </CandidateCardFrame>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ✅ 通常位置のボタン（ここにも出す） */}
                            <div
                                style={{
                                    marginTop: 12,
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onGoConfirm}
                                    disabled={!canGoConfirm}
                                >
                                    次へ（内容確認）
                                </button>

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
                                        fontSize: 12,
                                        opacity: 0.75,
                                    }}
                                >
                                    ※
                                    送信前に確認画面があります（送信は下部バーからも可能）
                                </span>
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <div style={{ display: "grid", gap: 12 }}>
                                <div style={{ fontWeight: 800 }}>内容確認</div>

                                <div
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 12,
                                        padding: 12,
                                        display: "grid",
                                        gap: 10,
                                        background: "#fafafa",
                                    }}
                                >
                                    <div>
                                        選挙:{" "}
                                        <strong>{data.electionTitle}</strong>
                                    </div>

                                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                                        合計: <b>{sum}</b> / {total}（残り{" "}
                                        {rest}）
                                    </div>

                                    <div style={{ display: "grid", gap: 8 }}>
                                        {chosenItems.length === 0 ? (
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    opacity: 0.8,
                                                }}
                                            >
                                                （配分がありません）
                                            </div>
                                        ) : (
                                            chosenItems.map((r, i) => {
                                                const partyColor =
                                                    (
                                                        r.party?.color ?? ""
                                                    ).trim() || "";
                                                const candMeta =
                                                    isCandidate(r) && r.targetId
                                                        ? (candMetaById[
                                                              r.targetId
                                                          ] ?? null)
                                                        : null;
                                                const candidateKey =
                                                    (
                                                        candMeta?.candidateKey ??
                                                        ""
                                                    ).trim() || null;
                                                const imgSrc =
                                                    isCandidate(r) && r.targetId
                                                        ? (resolveCandidateImageUrl(
                                                              candidateKey ??
                                                                  undefined,
                                                          ) ??
                                                          candMeta?.imageUrl ??
                                                          null)
                                                        : null;

                                                return (
                                                    <div
                                                        key={`${rowKey(r)}:${i}`}
                                                        style={{
                                                            display: "flex",
                                                            gap: 10,
                                                            alignItems:
                                                                "center",
                                                            flexWrap: "wrap",
                                                            padding: 10,
                                                            borderRadius: 10,
                                                            background: "#fff",
                                                            border: "1px solid #eee",
                                                        }}
                                                    >
                                                        {isNone(r) ? (
                                                            <div
                                                                aria-hidden
                                                                style={{
                                                                    width: 34,
                                                                    height: 34,
                                                                    borderRadius: 999,
                                                                    border: "1px solid #eee",
                                                                    background:
                                                                        "#fafafa",
                                                                }}
                                                            />
                                                        ) : (
                                                            <CandidateAvatar
                                                                name={r.label}
                                                                imageUrl={
                                                                    imgSrc
                                                                }
                                                                candidateKey={
                                                                    candidateKey ??
                                                                    undefined
                                                                }
                                                                index={i}
                                                                size={34}
                                                            />
                                                        )}

                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontWeight: 800,
                                                                    lineHeight: 1.2,
                                                                }}
                                                            >
                                                                {r.label}
                                                            </div>
                                                            {r.party
                                                                ?.shortName ||
                                                            r.party?.name ? (
                                                                <div
                                                                    style={{
                                                                        marginTop: 4,
                                                                    }}
                                                                >
                                                                    <PartyPill
                                                                        shortName={
                                                                            r
                                                                                .party
                                                                                ?.shortName ??
                                                                            ""
                                                                        }
                                                                        name={
                                                                            r
                                                                                .party
                                                                                ?.name ??
                                                                            r
                                                                                .party
                                                                                ?.shortName ??
                                                                            ""
                                                                        }
                                                                        color={
                                                                            partyColor
                                                                        }
                                                                    />
                                                                </div>
                                                            ) : null}
                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    opacity: 0.7,
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                {isNone(r)
                                                                    ? "誰も支持しない"
                                                                    : isCandidate(
                                                                            r,
                                                                        )
                                                                      ? "候補者"
                                                                      : "政党"}
                                                            </div>
                                                        </div>

                                                        <div
                                                            style={{
                                                                marginLeft:
                                                                    "auto",
                                                                fontWeight: 900,
                                                            }}
                                                        >
                                                            {r.points}pt
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.75,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        ※ 送信後、投票履歴に記録されます
                                        <br />※
                                        投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                                    </div>
                                </div>

                                {/* ✅ 通常位置の送信ボタン（ここにも出す） */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={onBackToEdit}
                                        disabled={busy}
                                    >
                                        戻る
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onSubmit}
                                        disabled={!canSubmit}
                                    >
                                        {busy
                                            ? "送信中..."
                                            : "この内容で投票する"}
                                    </button>

                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 12,
                                            opacity: 0.75,
                                            alignSelf: "center",
                                        }}
                                    >
                                        ※ 送信は下部バーからも行えます
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {isDev && (
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
                        candMetaCount: Object.keys(candMetaById).length,
                        partyMetaCount: Object.keys(partyByAnyKey).length,
                        step,
                        canGoConfirm,
                        canSubmit,
                    }}
                />
            )}
        </Page>
    );
}
