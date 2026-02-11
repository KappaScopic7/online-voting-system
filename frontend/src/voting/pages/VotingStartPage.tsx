// frontend/src/voting/pages/VotingStartPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
    useOutletContext,
} from "react-router-dom";
import { confirmVote, startVoting } from "../api/votes";
import type { VoteConfirmRequest, VoteStartResponse } from "../api/votes";
import { publicConfirmVote, publicStartVoting } from "../api/publicVotes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { publicToken } from "../../shared/tokenStorage";

import { CandidateCardFrame } from "../../candidates/ui/CandidateCardFrame";
import { PartyPill } from "../../parties/ui/PartyPill";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

import { fetchElectionCandidates } from "../../candidates/api/candidates";
import type {
    PublicLayoutOutletContext,
    FooterAction,
} from "../../layout/public/PublicLayout";

type LocationState = { from?: string } | null;

type CandidateMeta = {
    candidateId: string;
    candidateKey?: string | null;
    partyColor?: string | null;
    partyShortName?: string | null;
    partyName?: string | null;
    imageUrl?: string | null;
    title?: string | null;
};

type Option = {
    type: "CANDIDATE" | "NONE_SUPPORT";
    candidateId: string | null;
    name: string;
};

function keyOf(o: Option): string {
    return o.type === "NONE_SUPPORT"
        ? "NONE_SUPPORT"
        : `CANDIDATE:${o.candidateId}`;
}

function parseSelectedKey(
    k: string,
):
    | { type: "NONE_SUPPORT" }
    | { type: "CANDIDATE"; candidateId: string }
    | null {
    if (!k) return null;
    if (k === "NONE_SUPPORT") return { type: "NONE_SUPPORT" };
    const m = k.match(/^CANDIDATE:(.+)$/);
    if (!m) return null;
    return { type: "CANDIDATE", candidateId: m[1] };
}

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

// function readEid(token: string): string | null {
//     const pl = readJwtPayload(token);
//     return typeof pl?.eid === "string" ? pl.eid : null;
// }

function readJwtKind(token: string): string | null {
    const pl = readJwtPayload(token);
    const k = pl?.kind ?? pl?.KIND; // 念のため
    return typeof k === "string" ? k : null;
}

export function VotingStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    // ✅ public モード判定：session=public か public=1 のみ
    const session = (sp.get("session") ?? "").toLowerCase();
    const publicByQuery = session === "public" || isTruthy(sp.get("public"));

    // ✅ URL に public が無くても、publicToken が生きてたら public 扱い
    const hasStoredPublicToken = !!publicToken.get();
    const publicMode = publicByQuery || hasStoredPublicToken;

    // ✅ token は publicMode のときだけ使う（混線防止）
    const tokenFromQuery = publicByQuery ? sp.get("token") : null;
    const effectiveToken = publicMode
        ? tokenFromQuery?.trim() || publicToken.get()
        : null;
    const { setFooterActions } = useOutletContext<PublicLayoutOutletContext>();

    // ✅ publicMode で token を確定したら storage に保存
    useEffect(() => {
        if (!publicMode) return;
        const t = effectiveToken?.trim();
        if (!t) return;

        // ★ PUBLICセッション方式：
        // - 基本は PUBLIC token のみ保存（混線を構造的に排除）
        // - 移行期間だけ VOTE を許すならここで許可してもよいが、最終的には拒否推奨
        const kind = readJwtKind(t);
        if (kind && kind !== "PUBLIC") return;
        publicToken.set(t);

        publicToken.set(t);
    }, [publicMode, effectiveToken]);

    // ✅ URL から token を消去（リロード対策・クリーンアップ）
    useEffect(() => {
        if (!publicMode || !tokenFromQuery) return;
        const sp2 = new URLSearchParams(loc.search);
        sp2.delete("token");
        nav(`${loc.pathname}?${sp2.toString()}`, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicMode, tokenFromQuery]);

    const self = loc.pathname + loc.search;

    // ✅ 戻り先
    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );

    // ✅ Done へ引き継ぐ query
    const doneQS = publicMode ? "?session=public" : "";

    const [data, setData] = useState<VoteStartResponse | null>(null);
    const [metaById, setMetaById] = useState<Record<string, CandidateMeta>>({});

    const options = useMemo<Option[]>(() => {
        const base: Option[] =
            data?.candidates?.map((c) => ({
                type: "CANDIDATE",
                candidateId: c.candidateId,
                name: c.name,
            })) ?? [];

        base.push({
            type: "NONE_SUPPORT",
            candidateId: null,
            name: "誰も支持しない",
        });
        return base;
    }, [data]);

    const [selectedKey, setSelectedKey] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [step, setStep] = useState<"SELECT" | "CONFIRM">("SELECT");

    const load = async () => {
        if (!electionId) return;
        setError(null);
        setIsLoading(true);

        try {
            // 1) 投票開始データ
            const res = publicMode
                ? await publicStartVoting(electionId)
                : await startVoting(electionId);

            setData(res);

            // 2) ★候補者の詳細を取りに行って「政党カラー/画像」を埋める
            //    ※失敗しても投票自体は続けられる
            try {
                const list: any[] = await fetchElectionCandidates(electionId);
                const map: Record<string, CandidateMeta> = {};
                for (const c of list ?? []) {
                    const cid = String(
                        (c as any)?.id ?? (c as any)?.candidateId,
                    );
                    if (!cid) continue;

                    const party = (c as any)?.party ?? null;
                    map[cid] = {
                        candidateId: cid,
                        candidateKey: (c as any)?.candidateKey ?? null,
                        partyColor: party?.color ?? null,
                        partyShortName: party?.shortName ?? null,
                        partyName: party?.name ?? null,
                        imageUrl: (c as any)?.imageUrl ?? null,
                        title: (c as any)?.title ?? null,
                    };
                }
                setMetaById(map);
            } catch {
                setMetaById({});
            }

            // const firstCandidateId = res.candidates?.[0]?.candidateId ?? null;
            // 置き換え
            setSelectedKey((prev) => {
                if (prev && parseSelectedKey(prev)) return prev;
                return "";
            });

            setStep("SELECT");
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setError(
                    msg ??
                        "投票を開始できません（本人認証未完了 / 期間外 など）",
                );
            } else if (status === 401) {
                if (publicMode) publicToken.clear();

                setError(
                    msg ??
                        (publicMode
                            ? "本人認証の有効期限が切れました。もう一度本人認証してください。"
                            : "ログインが必要です"),
                );
            } else {
                setError(msg ?? "投票開始に失敗しました");
            }

            setData(null);
            setMetaById({});
            setSelectedKey("");
            setStep("SELECT");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!electionId) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId, publicByQuery, hasStoredPublicToken]);

    const selected = useMemo<Option | null>(() => {
        const p = parseSelectedKey(selectedKey);
        if (!p) return null;

        if (p.type === "NONE_SUPPORT") {
            return {
                type: "NONE_SUPPORT",
                candidateId: null,
                name: "誰も支持しない",
            };
        }
        return (
            options.find(
                (o) =>
                    o.type === "CANDIDATE" && o.candidateId === p.candidateId,
            ) ?? null
        );
    }, [selectedKey, options]);

    const canGoConfirm = !!selectedKey && !!data && !busy;
    const canSubmit = step === "CONFIRM" && !!selected && !busy;

    const onGoConfirm = useCallback(() => {
        if (!canGoConfirm) return;
        setError(null);
        setStep("CONFIRM");
    }, [canGoConfirm]);

    const onBackToSelect = useCallback(() => {
        setError(null);
        setStep("SELECT");
    }, []);

    const onSubmit = useCallback(async () => {
        if (!electionId || !selected || busy) return;

        setBusy(true);
        setError(null);

        try {
            const req: VoteConfirmRequest =
                selected.type === "NONE_SUPPORT"
                    ? { electionId, type: "NONE_SUPPORT" }
                    : {
                          electionId,
                          type: "CANDIDATE",
                          candidateId: selected.candidateId as string,
                      };

            const result = publicMode
                ? await publicConfirmVote(req)
                : await confirmVote(req);

            nav(`/voting/done${doneQS}`, {
                state: {
                    result,
                    from: backTo,
                    token: publicMode ? effectiveToken?.trim() || null : null,

                    selected: selected
                        ? {
                              type: selected.type,
                              candidateId: selected.candidateId,
                              name: selected.name,
                          }
                        : null,
                },
            });
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setError(msg ?? "投票できません（期間外/権限なし）");
            } else if (status === 401) {
                if (publicMode) publicToken.clear();

                setError(
                    msg ??
                        (publicMode
                            ? "本人認証の有効期限が切れました。もう一度本人認証してください。"
                            : "ログインが必要です"),
                );
            } else {
                setError(msg ?? "投票の送信に失敗しました");
            }
        } finally {
            setBusy(false);
        }
    }, [
        electionId,
        selected,
        busy,
        publicMode,
        doneQS,
        nav,
        backTo,
        effectiveToken,
    ]);

    useEffect(() => {
        const actions: FooterAction[] = [];

        // 左：戻る（SELECTなら backTo、CONFIRMなら選択へ戻す）
        if (step === "CONFIRM") {
            actions.push({
                kind: "BUTTON",
                label: "戻る",
                disabled: busy,
                onClick: onBackToSelect,
            });
        } else {
            actions.push({
                kind: "LINK",
                to: backTo,
                label: "戻る",
            });
        }

        // 右：メイン操作
        if (step === "SELECT") {
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

        // 離脱時にデフォルトへ戻す
        return () => setFooterActions(null);
    }, [
        setFooterActions,
        step,
        busy,
        canGoConfirm,
        canSubmit,
        backTo,
        onGoConfirm,
        onBackToSelect,
        onSubmit,
    ]);

    const isDev = import.meta.env?.DEV;

    if (!electionId) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>投票</h1>}
                actions={<Link to={backTo}>← 戻る</Link>}
                maxWidth={860}
            >
                <Card role="alert">electionId がありません</Card>
                <DevDebug value={{ state, loc }} />
            </Page>
        );
    }

    const title = data?.title ? `投票 / ${data.title}` : "投票";

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
                        disabled={isLoading || busy}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "読み込み中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={860}
        >
            {error && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ marginBottom: 10 }}>{error}</div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={load} disabled={isLoading || busy}>
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

            {!error && isLoading && <Card>読み込み中…</Card>}

            {!isLoading && data && (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 6 }}>
                            <strong style={{ fontSize: 16 }}>
                                {data.title}
                            </strong>

                            {publicMode && (
                                <div style={{ fontSize: 12, opacity: 0.75 }}>
                                    本人認証で投票しています（ログイン不要）
                                </div>
                            )}

                            {isDev && (
                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    electionId: {data.electionId}
                                </div>
                            )}

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
                    </Card>

                    <Card>
                        <div style={{ display: "grid", gap: 12 }}>
                            {step === "SELECT" ? (
                                <>
                                    <div style={{ fontWeight: 800 }}>
                                        投票先を選択
                                    </div>

                                    {/* ★ タイル（他ページと統一） */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gap: 10,
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(220px, 1fr))",
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {options.map((o, idx) => {
                                            const key = keyOf(o);
                                            const selectedNow =
                                                selectedKey === key;

                                            const meta =
                                                o.type === "CANDIDATE" &&
                                                o.candidateId
                                                    ? (metaById[
                                                          o.candidateId
                                                      ] ?? null)
                                                    : null;

                                            const partyColor =
                                                meta?.partyColor ?? null;

                                            const candidateKey =
                                                meta?.candidateKey ?? null;

                                            const imgSrc =
                                                o.type === "CANDIDATE"
                                                    ? (resolveCandidateImageUrl(
                                                          candidateKey ??
                                                              undefined,
                                                      ) ??
                                                      meta?.imageUrl ??
                                                      null)
                                                    : null;

                                            const detailHref =
                                                o.type === "CANDIDATE" &&
                                                o.candidateId
                                                    ? `/elections/${encodeURIComponent(
                                                          electionId,
                                                      )}/candidates/${encodeURIComponent(
                                                          o.candidateId,
                                                      )}`
                                                    : null;

                                            return (
                                                <div
                                                    key={key}
                                                    style={{
                                                        height: "100%",
                                                    }}
                                                >
                                                    <CandidateCardFrame
                                                        partyColor={partyColor}
                                                    >
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                if (busy)
                                                                    return;
                                                                setSelectedKey(
                                                                    key,
                                                                );
                                                            }}
                                                            onKeyDown={(ev) => {
                                                                if (busy)
                                                                    return;
                                                                if (
                                                                    ev.key ===
                                                                        "Enter" ||
                                                                    ev.key ===
                                                                        " "
                                                                ) {
                                                                    ev.preventDefault();
                                                                    setSelectedKey(
                                                                        key,
                                                                    );
                                                                }
                                                            }}
                                                            style={{
                                                                height: "100%",
                                                                display: "grid",
                                                                gap: 10,
                                                                alignContent:
                                                                    "start",
                                                                cursor: busy
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                                userSelect:
                                                                    "none",
                                                            }}
                                                        >
                                                            {/* 上段：左=選択 / 右=詳細（※詳細は選択しない） */}
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    gap: 10,
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "space-between",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 8,
                                                                        alignItems:
                                                                            "center",
                                                                        fontSize: 12,
                                                                        opacity: 0.85,
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="voteTarget"
                                                                        checked={
                                                                            selectedNow
                                                                        }
                                                                        onChange={() =>
                                                                            setSelectedKey(
                                                                                key,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            busy
                                                                        }
                                                                        onClick={(
                                                                            ev,
                                                                        ) =>
                                                                            ev.stopPropagation()
                                                                        }
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            opacity:
                                                                                selectedNow
                                                                                    ? 1
                                                                                    : 0.7,
                                                                        }}
                                                                    >
                                                                        {selectedNow
                                                                            ? "選択中"
                                                                            : "未選択"}
                                                                    </span>
                                                                </div>

                                                                {detailHref ? (
                                                                    <Link
                                                                        to={
                                                                            detailHref
                                                                        }
                                                                        state={{
                                                                            from: self,
                                                                        }}
                                                                        onClick={(
                                                                            ev,
                                                                        ) =>
                                                                            ev.stopPropagation()
                                                                        }
                                                                        onMouseDown={(
                                                                            ev,
                                                                        ) =>
                                                                            ev.stopPropagation()
                                                                        }
                                                                        style={{
                                                                            fontSize: 13,
                                                                        }}
                                                                    >
                                                                        詳細 →
                                                                    </Link>
                                                                ) : (
                                                                    <span
                                                                        style={{
                                                                            fontSize: 12,
                                                                            opacity: 0.6,
                                                                        }}
                                                                    >
                                                                        （候補者を選ばない）
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* 中央：アバター */}
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                {o.type ===
                                                                "CANDIDATE" ? (
                                                                    <CandidateAvatar
                                                                        name={
                                                                            o.name
                                                                        }
                                                                        imageUrl={
                                                                            imgSrc
                                                                        }
                                                                        candidateKey={
                                                                            candidateKey ??
                                                                            undefined
                                                                        }
                                                                        index={
                                                                            idx
                                                                        }
                                                                        size={
                                                                            64
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        aria-hidden
                                                                        style={{
                                                                            width: 64,
                                                                            height: 64,
                                                                            borderRadius: 999,
                                                                            border: "1px solid #eee",
                                                                            background:
                                                                                "#fafafa",
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* 名前 */}
                                                            <div
                                                                style={{
                                                                    textAlign:
                                                                        "center",
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize: 16,
                                                                        fontWeight: 800,
                                                                        lineHeight: 1.3,
                                                                        wordBreak:
                                                                            "break-word",
                                                                    }}
                                                                >
                                                                    {o.name}
                                                                </div>

                                                                {/* 政党 */}
                                                                {meta?.partyShortName ||
                                                                meta?.partyName ? (
                                                                    <div
                                                                        style={{
                                                                            marginTop: 6,
                                                                            display:
                                                                                "flex",
                                                                            justifyContent:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        <PartyPill
                                                                            shortName={
                                                                                meta.partyShortName ??
                                                                                ""
                                                                            }
                                                                            name={
                                                                                meta.partyName ??
                                                                                meta.partyShortName ??
                                                                                ""
                                                                            }
                                                                            color={
                                                                                meta.partyColor ??
                                                                                ""
                                                                            }
                                                                        />
                                                                    </div>
                                                                ) : o.type ===
                                                                  "CANDIDATE" ? (
                                                                    <div
                                                                        style={{
                                                                            marginTop: 6,
                                                                            fontSize: 12,
                                                                            opacity: 0.6,
                                                                        }}
                                                                    >
                                                                        {/* party 情報が取れない時のフォールバック */}
                                                                        （政党情報なし）
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            {/* 肩書き */}
                                                            {meta?.title ? (
                                                                <div
                                                                    style={{
                                                                        fontSize: 13,
                                                                        opacity: 0.85,
                                                                        lineHeight: 1.5,
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    {meta.title}
                                                                </div>
                                                            ) : null}

                                                            {/* CTA */}
                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        "auto",
                                                                    fontSize: 13,
                                                                    opacity: 0.85,
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                {selectedNow
                                                                    ? "この候補で投票する"
                                                                    : "クリックで選択"}
                                                            </div>
                                                        </div>
                                                    </CandidateCardFrame>
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
                                        <button
                                            onClick={onGoConfirm}
                                            disabled={!canGoConfirm}
                                        >
                                            次へ（内容確認）
                                        </button>

                                        <Link
                                            to={`/elections/${electionId}/candidates`}
                                            state={{ from: self }}
                                        >
                                            候補者を見る
                                        </Link>

                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: 12,
                                                opacity: 0.7,
                                            }}
                                        >
                                            ※ 送信前に確認画面があります
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 800 }}>
                                        内容確認
                                    </div>

                                    <div
                                        style={{
                                            border: "1px solid #eee",
                                            borderRadius: 12,
                                            padding: 12,
                                            display: "grid",
                                            gap: 8,
                                            background: "#fafafa",
                                        }}
                                    >
                                        <div>
                                            選挙: <strong>{data.title}</strong>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 10,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {selected?.type === "CANDIDATE" ? (
                                                <CandidateAvatar
                                                    name={
                                                        selected?.name ??
                                                        "（不明）"
                                                    }
                                                    imageUrl={null}
                                                    index={0}
                                                    size={34}
                                                />
                                            ) : (
                                                <div
                                                    aria-hidden
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 999,
                                                        border: "1px solid #eee",
                                                        background: "#fafafa",
                                                    }}
                                                />
                                            )}

                                            <div>
                                                投票先:{" "}
                                                <strong>
                                                    {selected?.name ??
                                                        "（不明）"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            ※ 送信後、投票履歴に記録されます
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            ※
                                            投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={onBackToSelect}
                                            disabled={busy}
                                        >
                                            戻る
                                        </button>
                                        <button
                                            onClick={onSubmit}
                                            disabled={!canSubmit}
                                        >
                                            {busy
                                                ? "送信中..."
                                                : "この内容で投票する"}
                                        </button>
                                    </div>
                                </>
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
                        metaByIdSize: Object.keys(metaById).length,
                        optionsLen: options.length,
                        error,
                        selectedKey,
                        selected,
                        busy,
                        isLoading,
                        step,
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
