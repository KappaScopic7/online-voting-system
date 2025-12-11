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
    const [confirmStep, setConfirmStep] = useState(false); // ★ 確認ステップ

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

                // CLOSED / PUBLISHED / DRAFT のときはここで止める（投票UIは出さない）
                if (detail.status !== "OPEN") {
                    setLoading(false);
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

    const selectedCandidate =
        candidates.find((c) => c.id === selectedCandidateId) ?? null;

    // 「投票内容を確認する」ボタン
    const handleOpenConfirm = () => {
        setMessage(null);
        setError(null);

        if (!election || election.status !== "OPEN") {
            setError("この選挙はオンライン投票の受付期間外です。");
            return;
        }

        if (selectedCandidateId == null || !selectedCandidate) {
            setError("候補者を選択してください。");
            return;
        }

        setConfirmStep(true);
        setMessage("投票内容を確認してください。");
    };

    // 「修正する」ボタン
    const handleCancelConfirm = () => {
        setConfirmStep(false);
        setMessage(null);
        // 選択は残したまま
    };

    // 実際の投票確定（確認ステップの「この内容で投票する」）
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
            setConfirmStep(false);

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

    // 致命的なロードエラー（選挙情報すら取れてない）
    if (!election) {
        if (error) {
            return <p style={{ color: "red" }}>{error}</p>;
        }
        return <p>選挙が見つかりません。</p>;
    }

    // OPEN 以外はここで終了（履歴や結果確認専用）
    if (election.status !== "OPEN") {
        return (
            <main>
                <h1>{election.name}</h1>
                <p style={{ color: "red", marginTop: 8 }}>
                    この選挙はオンライン投票の受付期間外です。
                </p>
            </main>
        );
    }

    if (candidates.length === 0) {
        return (
            <main>
                <h1>{election.name} に投票</h1>
                <p>候補者が登録されていません。</p>
            </main>
        );
    }

    return (
        <main>
            <h1>{election.name} に投票</h1>

            {myVote && (
                <p style={{ marginBottom: 8 }}>
                    現在の投票先：{myVote.candidateName}（
                    {myVote.partyName ?? "無所属"}）
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
                            background:
                                selectedCandidateId === c.id
                                    ? "#f0f8ff"
                                    : "transparent",
                        }}
                    >
                        <label
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "flex-start",
                            }}
                        >
                            <input
                                type="radio"
                                name="candidate"
                                value={c.id}
                                checked={selectedCandidateId === c.id}
                                onChange={() => {
                                    setSelectedCandidateId(c.id);
                                    setConfirmStep(false); // 別候補選んだら確認ステップリセット
                                    setMessage(null);
                                    setError(null);
                                }}
                            />
                            <div>
                                <div>
                                    <strong>{c.name}</strong>{" "}
                                    <span style={{ color: "#666" }}>
                                        （{c.partyName ?? "無所属"}）
                                    </span>
                                </div>
                                {c.profile && (
                                    <div
                                        style={{
                                            fontSize: "0.9rem",
                                            marginTop: 4,
                                        }}
                                    >
                                        {c.profile}
                                    </div>
                                )}
                            </div>
                        </label>
                    </li>
                ))}
            </ul>

            {/* 確認前 */}
            {!confirmStep && (
                <button
                    onClick={handleOpenConfirm}
                    disabled={submitting || selectedCandidateId == null}
                    style={{ marginTop: 8 }}
                >
                    {selectedCandidateId == null
                        ? "候補者を選択してください"
                        : "投票内容を確認する"}
                </button>
            )}

            {/* 確認ステップ */}
            {confirmStep && selectedCandidate && (
                <section
                    style={{
                        marginTop: 16,
                        padding: 12,
                        border: "1px solid #f0ad4e",
                        borderRadius: 4,
                        background: "#fff8e1",
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>投票内容の確認</h2>
                    <p>以下の候補者に投票します。よろしいですか？</p>
                    <p
                        style={{
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                            marginBottom: 4,
                        }}
                    >
                        {selectedCandidate.name}（
                        {selectedCandidate.partyName ?? "無所属"}）
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#555" }}>
                        ※再投票した場合は、最後に投票した候補者のみが有効票となります。
                    </p>

                    <div
                        style={{
                            marginTop: 12,
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleCancelConfirm}
                            disabled={submitting}
                        >
                            修正する
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "送信中..." : "この内容で投票する"}
                        </button>
                    </div>
                </section>
            )}

            {message && (
                <p style={{ color: "green", marginTop: 8 }}>
                    {message}
                </p>
            )}
            {error && (
                <p style={{ color: "red", marginTop: 8 }}>
                    {error}
                </p>
            )}
        </main>
    );
}
