// voting/pages/VotingStartPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmVote, startVoting } from "../api/votes";
import type { VoteStartResponse } from "../api/votes";

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

    const [data, setData] = useState<VoteStartResponse | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    // 確認ステップ（ページ分けしない簡易Confirm）
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
            nav("/voting/done", { state: { result } });
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message;
            if (status === 403)
                setError(msg ?? "投票できません（期間外/権限なし）");
            else setError(msg ?? "Vote failed");
            // 失敗したらSELECTに戻すかは好み。ここではCONFIRM維持。
        } finally {
            setBusy(false);
        }
    };

    const isDev = import.meta.env?.DEV;

    if (!electionId) {
        return (
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
                <h2 style={{ margin: 0 }}>Voting</h2>
                <p style={{ margin: 0 }}>electionId がありません</p>
                <Link to="/">← 戻る</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 860 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/">← 戻る</Link>
                <h2 style={{ margin: 0 }}>Voting</h2>

                <button
                    onClick={load}
                    style={{ marginLeft: "auto" }}
                    disabled={isLoading || busy}
                >
                    {isLoading ? "Reloading..." : "Reload"}
                </button>
            </header>

            {/* Error + 誘導 */}
            {error && (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                    }}
                    role="alert"
                >
                    <p style={{ marginTop: 0, marginBottom: 8 }}>{error}</p>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={load} disabled={isLoading || busy}>
                            再試行
                        </button>

                        {/* 403の原因が本人認証やメール認証の可能性があるので導線を置く（仮） */}
                        <Link
                            to="/identity/link"
                            state={{ from: loc.pathname + loc.search }}
                        >
                            本人認証へ
                        </Link>
                        <Link
                            to="/verify"
                            state={{ from: loc.pathname + loc.search }}
                        >
                            メール認証へ
                        </Link>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && <p>Loading...</p>}

            {/* Main */}
            {!isLoading && data && (
                <div style={{ display: "grid", gap: 10 }}>
                    {/* Election info */}
                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 12,
                        }}
                    >
                        <strong style={{ fontSize: 16 }}>{data.title}</strong>
                        {isDev && (
                            <div
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    marginTop: 6,
                                }}
                            >
                                electionId: {data.electionId}
                            </div>
                        )}
                    </div>

                    {/* Select / Confirm */}
                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 12,
                            display: "grid",
                            gap: 10,
                        }}
                    >
                        {step === "SELECT" ? (
                            <>
                                <div style={{ fontWeight: 600 }}>
                                    候補者を選択
                                </div>

                                {data.candidates?.length ? (
                                    <div style={{ display: "grid", gap: 6 }}>
                                        {data.candidates.map((c) => (
                                            <label
                                                key={c.candidateId}
                                                style={{
                                                    display: "flex",
                                                    gap: 10,
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="candidate"
                                                    value={c.candidateId}
                                                    checked={
                                                        selectedCandidateId ===
                                                        c.candidateId
                                                    }
                                                    onChange={() =>
                                                        setSelectedCandidateId(
                                                            c.candidateId,
                                                        )
                                                    }
                                                    disabled={busy}
                                                />
                                                <span>{c.name}</span>
                                                {isDev && (
                                                    <span
                                                        style={{
                                                            marginLeft: "auto",
                                                            fontSize: 12,
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        {c.candidateId}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            border: "1px solid #eee",
                                            borderRadius: 8,
                                            padding: 10,
                                        }}
                                    >
                                        <p style={{ margin: 0 }}>
                                            候補者がいません（投票できません）
                                        </p>
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
                                    >
                                        候補者（公開）を見る
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontWeight: 600 }}>内容確認</div>

                                <div
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 8,
                                        padding: 10,
                                        display: "grid",
                                        gap: 6,
                                    }}
                                >
                                    <div>
                                        選挙: <strong>{data.title}</strong>
                                    </div>
                                    <div>
                                        投票先:{" "}
                                        <strong>
                                            {selected?.name ?? "(不明)"}{" "}
                                        </strong>
                                    </div>
                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        ※ 送信後、投票履歴に記録されます
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
                </div>
            )}

            {/* DEV */}
            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(
                            {
                                data,
                                error,
                                selectedCandidateId,
                                busy,
                                electionId,
                                step,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </details>
            )}
        </div>
    );
}
