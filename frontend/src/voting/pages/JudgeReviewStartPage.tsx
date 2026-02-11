// frontend/src/voting/pages/JudgeReviewStartPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
    useOutletContext,
} from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { publicToken } from "../../shared/tokenStorage";
import type {
    JudgeReviewChoice,
    JudgeReviewConfirmRequest,
    JudgeReviewStartResponse,
} from "../model/judgeReviewTypes";
import { startJudgeReview, confirmJudgeReview } from "../api/judgeReview";
import {
    publicStartJudgeReview,
    publicConfirmJudgeReview,
} from "../api/publicJudgeReview";

import type {
    PublicLayoutOutletContext,
    FooterAction,
} from "../../layout/public/PublicLayout";

type LocationState = { from?: string } | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}
function readJwtPayload(token: string): any | null {
    try {
        const p = token.split(".")[1];
        if (!p) return null;
        const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
        return JSON.parse(atob(b64 + pad));
    } catch {
        return null;
    }
}

function readJwtEid(token: string): string | null {
    const pl = readJwtPayload(token);
    return typeof pl?.eid === "string" ? pl.eid : null;
}

function readJwtKind(token: string): string | null {
    const pl = readJwtPayload(token);
    const k = pl?.kind ?? pl?.KIND; // 念のため
    return typeof k === "string" ? k : null;
}

type Step = "EDIT" | "CONFIRM";

export function JudgeReviewStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    // ✅ public モード判定：session=public / public=1 のみ
    const session = (sp.get("session") ?? "").toLowerCase();
    const publicByQuery = session === "public" || isTruthy(sp.get("public"));

    // ✅ URL に public が無くても、publicToken が生きてたら public 扱い
    const hasStoredPublicToken = !!publicToken.get();
    const publicMode = publicByQuery || hasStoredPublicToken;

    // token は「URLで public 明示のときだけ」拾う
    const tokenFromQuery = publicByQuery ? sp.get("token") : null;
    const effectiveToken = publicMode
        ? tokenFromQuery?.trim() || publicToken.get()
        : null;

    const { setFooterActions } = useOutletContext<PublicLayoutOutletContext>();

    useEffect(() => {
        if (!publicMode) return;

        const t = effectiveToken?.trim();
        if (!t) return;

        const kind = readJwtKind(t);
        if (kind === "VOTE") {
            const eid = readJwtEid(t);
            if (eid && electionId && eid !== electionId) {
                publicToken.clear(); // VOTE の混線だけ捨てる
                return;
            }
        } else if (kind === "PUBLIC") {
            // election 縛りなしでOK
        } else {
            // 期待しない token は保存しない（任意）
            return;
        }

        publicToken.set(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicMode, effectiveToken, electionId]);

    // ✅ URL から token を消す（戻る/リロードで混入しないように）
    useEffect(() => {
        if (!publicMode) return;
        if (!tokenFromQuery) return;

        const sp2 = new URLSearchParams(loc.search);
        sp2.delete("token");
        nav(`${loc.pathname}?${sp2.toString()}`, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicMode, tokenFromQuery]);

    const self = loc.pathname + loc.search;
    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );

    const [data, setData] = useState<JudgeReviewStartResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [step, setStep] = useState<Step>("EDIT");

    // judgeCandidateId -> "OK"|"NO"
    const [choices, setChoices] = useState<Record<string, JudgeReviewChoice>>(
        {},
    );

    const judges = data?.judges ?? [];

    const completed = useMemo(() => {
        if (!data) return false;
        if (!judges.length) return false;
        return judges.every((j) => !!choices[j.candidateId]);
    }, [data, judges, choices]);

    const chosenList = useMemo(() => {
        return judges.map((j, idx) => {
            const v = choices[j.candidateId] ?? null;
            return {
                idx: idx + 1,
                candidateId: j.candidateId,
                name: j.name,
                title: j.title ?? "裁判官",
                choice: v, // "OK" | "NO" | null
            };
        });
    }, [judges, choices]);

    const load = useCallback(async () => {
        if (!electionId) return;

        setErr(null);
        setLoading(true);

        try {
            const res = publicMode
                ? await publicStartJudgeReview(electionId)
                : await startJudgeReview(electionId);

            setData(res);

            // const base: Record<string, JudgeReviewChoice> = {};
            // const cur = (res as any)?.current ?? null;
            // if (cur) {
            //     for (const [k, v] of Object.entries(cur)) {
            //         if (v === "OK" || v === "NO") base[k] = v;
            //     }
            // }
            // setChoices(base);
            setChoices({});

            setStep("EDIT");
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;

            if (status === 403) {
                setErr(
                    msg ??
                        "投票を開始できません（本人認証未完了 / 期間外 など）",
                );
            } else if (status === 401) {
                if (publicMode) publicToken.clear();

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
            setChoices({});
            setStep("EDIT");
        } finally {
            setLoading(false);
        }
    }, [electionId, publicMode]);

    useEffect(() => {
        if (!electionId) return;
        load();
    }, [electionId, publicMode, load]);

    const setChoice = (judgeCandidateId: string, v: JudgeReviewChoice) => {
        setChoices((prev) => ({ ...prev, [judgeCandidateId]: v }));
    };

    const onGoConfirm = useCallback(() => {
        if (!completed) {
            setErr("全裁判官分の選択が必要です（〇/×）");
            return;
        }
        setErr(null);
        setStep("CONFIRM");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [completed]);

    const onBackToEdit = useCallback(() => {
        if (busy) return;
        setErr(null);
        setStep("EDIT");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [busy]);

    const onSubmit = useCallback(async () => {
        if (!data || busy) return;
        if (!completed) {
            setErr("全裁判官分の選択が必要です（〇/×）");
            setStep("EDIT");
            return;
        }

        setBusy(true);
        setErr(null);

        try {
            const req: JudgeReviewConfirmRequest = {
                electionId: data.electionId,
                choices: judges.map((j) => ({
                    judgeCandidateId: j.candidateId,
                    choice: choices[j.candidateId] as JudgeReviewChoice,
                })),
            };

            if (publicMode) await publicConfirmJudgeReview(req);
            else await confirmJudgeReview(req);

            nav(`/judge-review/done${publicMode ? "?session=public" : ""}`, {
                state: {
                    from: backTo,
                    electionId: data.electionId,
                    electionTitle: data.electionTitle,
                    token: publicMode ? effectiveToken?.trim() || null : null,
                },
            });
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;

            if (status === 403)
                setErr(msg ?? "投票できません（期間外/権限なし）");
            else if (status === 401) {
                if (publicMode) publicToken.clear();

                setErr(
                    msg ??
                        (publicMode
                            ? "本人認証の有効期限が切れました。もう一度本人認証してください。"
                            : "ログインが必要です"),
                );
            } else setErr(msg ?? "送信に失敗しました");

            // 送信失敗時は編集に戻す
            setStep("EDIT");
        } finally {
            setBusy(false);
        }
    }, [
        data,
        busy,
        completed,
        judges,
        choices,
        publicMode,
        nav,
        backTo,
        effectiveToken,
    ]);

    // ✅ footer actions（EDIT/CONFIRM/ERR で出し分け）
    useEffect(() => {
        const actions: FooterAction[] = [];

        // 左：戻る
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
                disabled: busy || loading || !completed,
                onClick: onGoConfirm,
            });
        } else {
            actions.push({
                kind: "BUTTON",
                label: busy ? "送信中..." : "この内容で投票する",
                disabled: busy || !completed,
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
        completed,
        onGoConfirm,
        onBackToEdit,
        onSubmit,
    ]);

    const isDev = import.meta.env?.DEV;

    if (!electionId) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>国民審査</h1>}
                actions={<Link to={backTo}>← 戻る</Link>}
                maxWidth={860}
            >
                <Card role="alert">electionId がありません</Card>
                <DevDebug value={{ state, loc }} />
            </Page>
        );
    }

    const title = data?.electionTitle
        ? `国民審査 / ${data.electionTitle}`
        : "国民審査";

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
                    <button
                        onClick={load}
                        disabled={loading || busy}
                        style={{ marginLeft: 8 }}
                    >
                        {loading ? "読み込み中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={860}
        >
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

                        <Link to={backTo}>戻る</Link>
                    </div>
                </Card>
            )}

            {!err && loading && <Card>読み込み中…</Card>}

            {!loading && data && (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 6 }}>
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
                                    fontSize: 12,
                                    opacity: 0.75,
                                    lineHeight: 1.6,
                                }}
                            >
                                ※ 全裁判官について「信任（〇）/
                                罷免（×）」を選択します
                                <br />※ 期間内なら投票内容は変更できます
                            </div>
                        </div>
                    </Card>

                    {step === "EDIT" ? (
                        <Card>
                            <div style={{ display: "grid", gap: 12 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        alignItems: "baseline",
                                    }}
                                >
                                    <div style={{ fontWeight: 800 }}>
                                        裁判官ごとに選択
                                    </div>
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 12,
                                            opacity: 0.75,
                                        }}
                                    >
                                        完了:{" "}
                                        {
                                            judges.filter(
                                                (j) => !!choices[j.candidateId],
                                            ).length
                                        }
                                        /{judges.length}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gap: 10 }}>
                                    {judges.map((j, idx) => {
                                        const v =
                                            choices[j.candidateId] ?? null;
                                        return (
                                            <div
                                                key={j.candidateId}
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
                                                        flexWrap: "wrap",
                                                        alignItems: "baseline",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {idx + 1}. {j.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            opacity: 0.75,
                                                        }}
                                                    >
                                                        {j.title ?? "裁判官"}
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginLeft: "auto",
                                                            fontSize: 12,
                                                            opacity: 0.75,
                                                        }}
                                                    >
                                                        選択: <b>{v ?? "-"}</b>
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
                                                    <label
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            gap: 8,
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`jr:${j.candidateId}`}
                                                            checked={v === "OK"}
                                                            onChange={() =>
                                                                setChoice(
                                                                    j.candidateId,
                                                                    "OK",
                                                                )
                                                            }
                                                            disabled={busy}
                                                        />
                                                        信任（〇）
                                                    </label>

                                                    <label
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            gap: 8,
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`jr:${j.candidateId}`}
                                                            checked={v === "NO"}
                                                            onChange={() =>
                                                                setChoice(
                                                                    j.candidateId,
                                                                    "NO",
                                                                )
                                                            }
                                                            disabled={busy}
                                                        />
                                                        罷免（×）
                                                    </label>

                                                    <Link
                                                        to={`/elections/${data.electionId}/candidates/${j.candidateId}`}
                                                        state={{ from: self }}
                                                        style={{
                                                            marginLeft: "auto",
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        詳細 →
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ✅ 通常位置の確認ボタンも出す */}
                                <div
                                    style={{
                                        marginTop: 4,
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={onGoConfirm}
                                        disabled={busy || loading || !completed}
                                    >
                                        次へ（内容確認）
                                    </button>

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

                                {!completed && (
                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        ※
                                        全裁判官分の選択が必要です（次へ進めません）
                                    </div>
                                )}
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

                                    <div style={{ display: "grid", gap: 8 }}>
                                        {chosenList.map((x) => {
                                            const label =
                                                x.choice === "OK"
                                                    ? "信任（〇）"
                                                    : x.choice === "NO"
                                                      ? "罷免（×）"
                                                      : "-";
                                            return (
                                                <div
                                                    key={x.candidateId}
                                                    style={{
                                                        display: "flex",
                                                        gap: 10,
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        padding: 10,
                                                        borderRadius: 10,
                                                        background: "#fff",
                                                        border: "1px solid #eee",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {x.idx}. {x.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            opacity: 0.75,
                                                        }}
                                                    >
                                                        {x.title}
                                                    </div>

                                                    <div
                                                        style={{
                                                            marginLeft: "auto",
                                                            fontWeight: 900,
                                                        }}
                                                    >
                                                        {label}
                                                    </div>
                                                </div>
                                            );
                                        })}
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

                                {/* ✅ 通常位置の確定ボタンも出す */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        flexWrap: "wrap",
                                        alignItems: "center",
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
                                        disabled={busy || !completed}
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
                        choices,
                        completed,
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
                        step,
                    }}
                />
            )}
        </Page>
    );
}
