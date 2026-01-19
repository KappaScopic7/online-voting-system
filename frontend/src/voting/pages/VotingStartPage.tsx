// voting/pages/VotingStartPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmVote, startVoting } from "../api/votes";
import type { VoteStartResponse } from "../api/votes";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export function VotingStartPage() {
    const nav = useNavigate();
    const q = useQuery();
    const electionId = q.get("electionId");

    const [data, setData] = useState<VoteStartResponse | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        if (!electionId) return;
        setError(null);
        try {
            const res = await startVoting(electionId);
            setData(res);
            setSelectedCandidateId(res.candidates?.[0]?.candidateId ?? "");
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
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    const onConfirm = async () => {
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
        } finally {
            setBusy(false);
        }
    };

    if (!electionId) {
        return (
            <div>
                <h2>Voting</h2>
                <p>electionId がありません</p>
                <Link to="/">← 戻る</Link>
            </div>
        );
    }

    return (
        <div>
            <h2>Voting</h2>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Link to="/">← 戻る</Link>
                <button onClick={load} style={{ marginLeft: "auto" }}>
                    Reload
                </button>
            </div>

            {error && (
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12,
                    }}
                >
                    <p style={{ margin: 0 }}>{error}</p>
                </div>
            )}

            {data === null ? (
                <p>Loading...</p>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 12,
                        }}
                    >
                        <strong style={{ fontSize: 16 }}>{data.title}</strong>
                        <div
                            style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}
                        >
                            electionId: {data.electionId}
                        </div>
                    </div>

                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: 12,
                            display: "grid",
                            gap: 8,
                        }}
                    >
                        <div style={{ fontWeight: 600 }}>候補者を選択</div>

                        {data.candidates?.length ? (
                            data.candidates.map((c) => (
                                <label
                                    key={c.candidateId}
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
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
                                    />
                                    <span>{c.name}</span>
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 12,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {c.candidateId}
                                    </span>
                                </label>
                            ))
                        ) : (
                            <p style={{ margin: 0 }}>候補者がいません</p>
                        )}

                        <button
                            onClick={onConfirm}
                            disabled={!selectedCandidateId || busy}
                            style={{ marginTop: 8 }}
                        >
                            {busy ? "送信中..." : "この内容で投票する"}
                        </button>
                    </div>
                </div>
            )}
            <div style={{ marginTop: 16 }}>
                Raw JSON
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(
                        { data, error, selectedCandidateId, busy, electionId },
                        null,
                        2,
                    )}
                </pre>
            </div>
        </div>
    );
}
