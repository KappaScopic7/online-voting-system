// frontend/src/voting/pages/VotingStartPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmVote, startVoting } from "../api/votes";
import type { VoteStartResponse } from "../api/votes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

type LocationState = { from?: string } | null;

export function VotingStartPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const q = useQuery();
    const electionId = q.get("electionId");

    const self = loc.pathname + loc.search;
    const backTo = normalizeFrom(state?.from ?? "/me/elections");

    const [data, setData] = useState<VoteStartResponse | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [step, setStep] = useState<"SELECT" | "CONFIRM">("SELECT");

    const load = async () => {
        if (!electionId) return;
        setError(null);
        setIsLoading(true);

        try {
            const res = await startVoting(electionId);
            setData(res);
            setSelectedCandidateId(res.candidates?.[0]?.candidateId ?? "");
            setStep("SELECT");
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;

            if (status === 403) {
                setError(
                    msg ??
                        "投票を開始できません（本人リンク未完了 / 期間外 など）",
                );
            } else {
                setError(msg ?? "Failed to start voting");
            }

            setData(null);
            setSelectedCandidateId("");
            setStep("SELECT");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const selected = useMemo(() => {
        return (
            data?.candidates?.find(
                (c) => c.candidateId === selectedCandidateId,
            ) ?? null
        );
    }, [data, selectedCandidateId]);

    const canGoConfirm =
        !!selectedCandidateId && !!data?.candidates?.length && !busy;
    const canSubmit = step === "CONFIRM" && !!selectedCandidateId && !busy;

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
        if (!electionId || !selectedCandidateId) return;

        setBusy(true);
        setError(null);
        try {
            const result = await confirmVote(electionId, selectedCandidateId);

            nav("/voting/done", {
                state: {
                    result,
                    from: backTo,
                },
            });
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;
            if (status === 403) {
                setError(msg ?? "投票できません（期間外/権限なし）");
            } else {
                setError(msg ?? "Vote failed");
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
                        {isLoading ? "Reloading..." : "再読み込み"}
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

            {!error && isLoading && <Card>読み込み中…</Card>}

            {!isLoading && data && (
                <div style={{ display: "grid", gap: 12 }}>
                    <Card>
                        <div style={{ display: "grid", gap: 6 }}>
                            <strong style={{ fontSize: 16 }}>
                                {data.title}
                            </strong>
                            {isDev && (
                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    electionId: {data.electionId}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: "grid", gap: 12 }}>
                            {step === "SELECT" ? (
                                <>
                                    <div style={{ fontWeight: 800 }}>
                                        候補者を選択
                                    </div>

                                    {data.candidates?.length ? (
                                        <div
                                            style={{ display: "grid", gap: 10 }}
                                        >
                                            {data.candidates.map((c, idx) => {
                                                const selectedNow =
                                                    selectedCandidateId ===
                                                    c.candidateId;

                                                return (
                                                    <label
                                                        key={c.candidateId}
                                                        style={{
                                                            border: "1px solid #eee",
                                                            borderRadius: 12,
                                                            padding: 12,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 12,
                                                            background:
                                                                selectedNow
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
                                                        onMouseEnter={(e) => {
                                                            if (busy) return;
                                                            e.currentTarget.style.boxShadow =
                                                                "0 2px 10px rgba(0,0,0,0.06)";
                                                            e.currentTarget.style.transform =
                                                                "translateY(-1px)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.boxShadow =
                                                                "0 0 0 rgba(0,0,0,0)";
                                                            e.currentTarget.style.transform =
                                                                "translateY(0)";
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="candidate"
                                                            value={
                                                                c.candidateId
                                                            }
                                                            checked={
                                                                selectedNow
                                                            }
                                                            onChange={() =>
                                                                setSelectedCandidateId(
                                                                    c.candidateId,
                                                                )
                                                            }
                                                            disabled={busy}
                                                        />

                                                        <CandidateAvatar
                                                            name={c.name}
                                                            imageUrl={null}
                                                            index={idx}
                                                            size={32}
                                                        />

                                                        <span
                                                            style={{
                                                                fontWeight:
                                                                    selectedNow
                                                                        ? 800
                                                                        : 600,
                                                            }}
                                                        >
                                                            {c.name}
                                                        </span>

                                                        <Link
                                                            to={`/elections/${electionId}/candidates/${c.candidateId}`}
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

                                                        {isDev && (
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                {c.candidateId}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                border: "1px solid #eee",
                                                borderRadius: 12,
                                                padding: 12,
                                                background: "#fafafa",
                                            }}
                                        >
                                            候補者がいません（投票できません）
                                        </div>
                                    )}

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
                                            候補者（公開）を見る
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
                                            <CandidateAvatar
                                                name={selected?.name ?? "?"}
                                                imageUrl={null}
                                                index={0}
                                                size={34}
                                            />

                                            <div>
                                                投票先:{" "}
                                                <strong>
                                                    {selected?.name ?? "(不明)"}
                                                </strong>
                                            </div>

                                            {selected?.candidateId && (
                                                <Link
                                                    to={`/elections/${electionId}/candidates/${selected.candidateId}`}
                                                    state={{ from: self }}
                                                    style={{
                                                        marginLeft: "auto",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    詳細 →
                                                </Link>
                                            )}
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

            <DevDebug
                value={{
                    electionId,
                    data,
                    error,
                    selectedCandidateId,
                    busy,
                    isLoading,
                    step,
                    backTo,
                    self,
                    state,
                }}
            />
        </Page>
    );
}
