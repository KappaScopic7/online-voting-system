// frontend/src/pages/VotePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    fetchElectionDetail,
    fetchCandidates,
    fetchMyVote,
    castVote,
} from "../api/authClient";
import type { Candidate, MyVote, ElectionDetail } from "../api/authClient";

export function VotePage() {
    const { id } = useParams<{ id: string }>();
    const [election, setElection] = useState<ElectionDetail | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [myVote, setMyVote] = useState<MyVote | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        if (!id) {
            setError("選挙IDが不正です。");
            setLoading(false);
            return;
        }

        const electionId = Number(id);

        const load = async () => {
            try {
                // ① まず選挙情報を取得してステータスを見る
                const detail = await fetchElectionDetail(token, electionId);
                setElection(detail);

                if (detail.status !== "OPEN") {
                    // 受付期間外 → 投票UIは出さず、メッセージだけ表示
                    setError("この選挙はオンライン投票の受付期間外です。");
                    return;
                }

                // ② OPEN のときだけ候補者・自分の投票情報を取得
                const [cands, my] = await Promise.all([
                    fetchCandidates(token, electionId),
                    fetchMyVote(token, electionId),
                ]);

                setCandidates(cands);
                setMyVote(my);
                if (my) {
                    setSelectedCandidateId(my.candidateId);
                }
            } catch (err: any) {
                setError(err.message ?? "情報の取得に失敗しました");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, navigate]);

    const handleSubmit = async () => {
        setMessage(null);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        if (!id) {
            setError("選挙IDが不正です。");
            return;
        }

        // ★ 二重ガード：OPEN 以外では投票処理自体を行わない
        if (!election || election.status !== "OPEN") {
            setError("この選挙はオンライン投票の受付期間外です。");
            return;
        }

        if (selectedCandidateId == null) {
            setError("候補者を選択してください。");
            return;
        }

        setSubmitting(true);
        try {
            await castVote(token, Number(id), selectedCandidateId);
            setMessage("投票が完了しました。（再投票すると最後の票のみ有効になります）");
            const my = await fetchMyVote(token, Number(id));
            setMyVote(my);
        } catch (err: any) {
            setError(err.message ?? "投票に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (error) {
        // CLOSED などもここで表示される
        return <p style={{ color: "red" }}>{error}</p>;
    }

    if (!election) {
        return <p>選挙が見つかりません。</p>;
    }

    if (candidates.length === 0) {
        return <p>候補者が登録されていません。</p>;
    }

    return (
        <main>
            <h1>{election.name} に投票</h1>

            {myVote && (
                <p style={{ marginBottom: 8 }}>
                    現在の投票先：{myVote.candidateName}（{myVote.partyName ?? "無所属"}）
                </p>
            )}

            <ul style={{ listStyle: "none", padding: 0 }}>
                {candidates.map((c) => (
                    <li
                        key={c.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            padding: 8,
                            marginBottom: 8,
                        }}
                    >
                        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <input
                                type="radio"
                                name="candidate"
                                value={c.id}
                                checked={selectedCandidateId === c.id}
                                onChange={() => setSelectedCandidateId(c.id)}
                            />
                            <div>
                                <div>
                                    <strong>{c.name}</strong>{" "}
                                    <span style={{ color: "#666" }}>
                                        （{c.partyName ?? "無所属"}）
                                    </span>
                                </div>
                                {c.profile && (
                                    <div style={{ fontSize: "0.9rem", marginTop: 4 }}>
                                        {c.profile}
                                    </div>
                                )}
                            </div>
                        </label>
                    </li>
                ))}
            </ul>

            <button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "送信中..." : "この候補者に投票する"}
            </button>

            {message && <p style={{ color: "green", marginTop: 8 }}>{message}</p>}
            {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
        </main>
    );
}
