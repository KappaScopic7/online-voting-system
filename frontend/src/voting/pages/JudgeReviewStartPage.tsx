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

export function JudgeReviewStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    const session = (sp.get("session") ?? "").toLowerCase();
    const publicMode = session === "public" || isTruthy(sp.get("public"));

    const tokenFromQuery = publicMode ? sp.get("token") : null;
    const effectiveToken = publicMode
        ? tokenFromQuery?.trim() || publicToken.get()
        : null;

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

    const [data, setData] = useState<JudgeReviewStartResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);

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

    const load = useCallback(async () => {
        if (!electionId) return;

        setErr(null);
        setLoading(true);

        try {
            const res = publicMode
                ? await publicStartJudgeReview(electionId)
                : await startJudgeReview(electionId);

            setData(res);

            const base: Record<string, JudgeReviewChoice> = {};
            const cur = (res as any)?.current ?? null;
            if (cur) {
                for (const [k, v] of Object.entries(cur)) {
                    if (v === "OK" || v === "NO") base[k] = v;
                }
            }
            setChoices(base);
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
            setChoices({});
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

    const onSubmit = useCallback(async () => {
        if (!data || busy) return;
        if (!completed) {
            setErr("全裁判官分の選択が必要です（〇/×）");
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

            if (publicMode) {
                await publicConfirmJudgeReview(req);
            } else {
                await confirmJudgeReview(req);
            }

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

    // ✅ footer actions（下部バーに移す）
    useEffect(() => {
        const actions: FooterAction[] = [];

        // 左：戻る
        actions.push({ kind: "LINK", to: backTo, label: "戻る" });

        // 右：再試行 or 送信
        if (err) {
            actions.push({
                kind: "BUTTON",
                label: loading ? "読み込み中..." : "再試行",
                disabled: loading || busy || !electionId,
                onClick: load,
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
        backTo,
        err,
        loading,
        busy,
        electionId,
        load,
        completed,
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
                                    const v = choices[j.candidateId] ?? null;
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
                                                    style={{ fontWeight: 800 }}
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
                                                        display: "inline-flex",
                                                        gap: 8,
                                                        alignItems: "center",
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
                                                        display: "inline-flex",
                                                        gap: 8,
                                                        alignItems: "center",
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

                            {/* 下部の「戻る/送信」は footer bar に移した */}
                            {!completed && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    ※
                                    全裁判官分の選択が必要です（送信は下部バー）
                                </div>
                            )}
                        </div>
                    </Card>
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
                    }}
                />
            )}
        </Page>
    );
}
