import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { confirmVote, startVoting } from "../api/votes";
import type { VoteConfirmRequest, VoteStartResponse } from "../api/votes";
import { publicConfirmVote, publicStartVoting } from "../api/publicVotes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { publicToken } from "../../shared/tokenStorage";

type LocationState = { from?: string } | null;

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

export function VotingStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    // ✅ public モード判定（EntryPage と揃える）
    const session = (sp.get("session") ?? "").toLowerCase(); // "public" | ""
    const tokenFromQuery = sp.get("token");
    const effectiveToken = tokenFromQuery?.trim() || publicToken.get();
    const publicMode =
        session === "public" ||
        isTruthy(sp.get("public")) ||
        !!(effectiveToken && effectiveToken.trim());

    // ✅ token を確定したら storage に保存（以降のAPIで httpPublic が自動付与）
    useEffect(() => {
        if (effectiveToken && effectiveToken.trim()) {
            publicToken.set(effectiveToken.trim());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveToken]);

    const self = loc.pathname + loc.search;

    // ✅ 戻り先：public は /elections をデフォルトに（EntryPage の方針と整合）
    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );

    // ✅ Done へ引き継ぐ query（DonePage が query で public 判定するため）
    const doneQS = publicMode ? "?session=public" : "";

    const [data, setData] = useState<VoteStartResponse | null>(null);

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
            const res = publicMode
                ? await publicStartVoting(electionId)
                : await startVoting(electionId);

            setData(res);

            const firstCandidateId = res.candidates?.[0]?.candidateId ?? null;
            setSelectedKey(
                firstCandidateId
                    ? `CANDIDATE:${firstCandidateId}`
                    : "NONE_SUPPORT",
            );
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
                setError(
                    msg ??
                        (publicMode
                            ? "本人認証が必要です（アプリ/NFCから開いてください）"
                            : "ログインが必要です"),
                );
            } else {
                setError(msg ?? "投票開始に失敗しました");
            }

            setData(null);
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
    }, [electionId, publicMode]);

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

    const onGoConfirm = () => {
        if (!canGoConfirm) return;
        setError(null);
        setStep("CONFIRM");
    };

    const onBackToSelect = () => {
        setError(null);
        setStep("SELECT");
    };

    const onSubmit = async () => {
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

            // ✅ DonePage は query で public 判定するので必ず付与
            nav(`/voting/done${doneQS}`, { state: { result, from: backTo } });
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setError(msg ?? "投票できません（期間外/権限なし）");
            } else if (status === 401) {
                setError(
                    msg ??
                        (publicMode
                            ? "本人認証が必要です（アプリ/NFCから開いてください）"
                            : "ログインが必要です"),
                );
            } else {
                setError(msg ?? "投票の送信に失敗しました");
            }
        } finally {
            setBusy(false);
        }
    };

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

                        {/* public の場合はログインを要求しないので文言だけ残す/必要なら別導線に変える */}
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

                                    <div style={{ display: "grid", gap: 10 }}>
                                        {options.map((o, idx) => {
                                            const key = keyOf(o);
                                            const selectedNow =
                                                selectedKey === key;
                                            const isCandidate =
                                                o.type === "CANDIDATE" &&
                                                !!o.candidateId;

                                            return (
                                                <label
                                                    key={key}
                                                    style={{
                                                        border: "1px solid #eee",
                                                        borderRadius: 12,
                                                        padding: 12,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        background: selectedNow
                                                            ? "#f5f5f5"
                                                            : "#fff",
                                                        cursor: busy
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        transition:
                                                            "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
                                                        boxShadow:
                                                            "0 0 0 rgba(0,0,0,0)",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="voteTarget"
                                                        value={key}
                                                        checked={selectedNow}
                                                        onChange={() =>
                                                            setSelectedKey(key)
                                                        }
                                                        disabled={busy}
                                                    />

                                                    {o.type === "CANDIDATE" ? (
                                                        <CandidateAvatar
                                                            name={o.name}
                                                            imageUrl={null}
                                                            index={idx}
                                                            size={32}
                                                        />
                                                    ) : (
                                                        <div
                                                            aria-hidden
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 999,
                                                                border: "1px solid #eee",
                                                                background:
                                                                    "#fafafa",
                                                            }}
                                                        />
                                                    )}

                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                selectedNow
                                                                    ? 800
                                                                    : 600,
                                                        }}
                                                    >
                                                        {o.name}
                                                    </span>

                                                    {isCandidate ? (
                                                        <Link
                                                            to={`/elections/${electionId}/candidates/${o.candidateId}`}
                                                            state={{
                                                                from: self,
                                                            }}
                                                            onClick={(ev) =>
                                                                ev.stopPropagation()
                                                            }
                                                            style={{
                                                                fontSize: 13,
                                                                marginLeft:
                                                                    "auto",
                                                            }}
                                                        >
                                                            詳細 →
                                                        </Link>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                opacity: 0.75,
                                                                marginLeft:
                                                                    "auto",
                                                            }}
                                                        >
                                                            （候補者を選ばない）
                                                        </span>
                                                    )}
                                                </label>
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
                        hasStoredPublicToken: !!publicToken.get(),
                    }}
                />
            )}
        </Page>
    );
}
