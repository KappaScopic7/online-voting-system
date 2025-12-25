// frontend/src/pages/VotePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    fetchElectionDetail,
    fetchCandidates,
    fetchMyVote,
    castVote,
    fetchMyVerification,
    verifyIdentity,
} from '../api/authClient';
import type { Candidate, MyVote, ElectionDetail } from '../api/authClient';

export function VotePage() {
    const { id } = useParams<{ id: string }>();

    const [election, setElection] = useState<ElectionDetail | null>(null);
    const [verified, setVerified] = useState(false);

    const [cardId, setCardId] = useState('');
    const [pin, setPin] = useState('');

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [myVote, setMyVote] = useState<MyVote | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ★確認ステップ
    const [confirming, setConfirming] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const selectedCandidate = useMemo(() => {
        if (selectedCandidateId == null) return null;
        return candidates.find((c) => c.id === selectedCandidateId) ?? null;
    }, [selectedCandidateId, candidates]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        if (!id) {
            setError('選挙IDが不正です。');
            setLoading(false);
            return;
        }

        const electionId = Number(id);

        const load = async () => {
            try {
                const detail = await fetchElectionDetail(token, electionId);
                setElection(detail);

                if (detail.status !== 'OPEN') {
                    setError('この選挙はオンライン投票の受付期間外です。');
                    return;
                }

                const ok = await fetchMyVerification(token, electionId);
                setVerified(ok);

                // 認証済みなら投票UIをロード
                if (ok) {
                    const [cands, my] = await Promise.all([
                        fetchCandidates(token, electionId),
                        fetchMyVote(token, electionId),
                    ]);

                    setCandidates(cands);
                    setMyVote(my);
                    if (my) setSelectedCandidateId(my.candidateId);
                }
            } catch (err: any) {
                if (err?.message === 'unauthorized') {
                    localStorage.removeItem('accessToken');
                    navigate('/login');
                    return;
                }
                setError(err?.message ?? '情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, navigate]);

    const reloadVoteUI = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!id) return;

        const electionId = Number(id);
        const [cands, my] = await Promise.all([
            fetchCandidates(token, electionId),
            fetchMyVote(token, electionId),
        ]);

        setCandidates(cands);
        setMyVote(my);
        if (my) setSelectedCandidateId(my.candidateId);
    };

    const handleVerify = async () => {
        setMessage(null);
        setError(null);

        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!id) {
            setError('選挙IDが不正です。');
            return;
        }
        if (!election || election.status !== 'OPEN') {
            setError('この選挙はオンライン投票の受付期間外です。');
            return;
        }

        if (!cardId.trim()) {
            setError('カードIDを入力してください。');
            return;
        }
        if (!pin.trim()) {
            setError('暗証番号（PIN）を入力してください。');
            return;
        }

        setVerifying(true);
        try {
            await verifyIdentity(token, Number(id), {
                cardId: cardId.trim(),
                pin: pin.trim(),
            });

            const ok = await fetchMyVerification(token, Number(id));
            setVerified(ok);

            if (!ok) {
                setError('本人認証に失敗しました。');
                return;
            }

            // 認証成功
            setMessage('本人認証が完了しました。投票を続行できます。');
            setCardId('');
            setPin('');
            await reloadVoteUI();
        } catch (err: any) {
            if (err?.message === 'unauthorized') {
                localStorage.removeItem('accessToken');
                navigate('/login');
                return;
            }
            setError(err?.message ?? '本人認証に失敗しました');
        } finally {
            setVerifying(false);
        }
    };

    // ★確認画面へ（ここが「確認へ」ボタン）
    // 今回：ラベルを「投票履歴へ」に変えるだけで、挙動は確認画面へ進むのは維持
    const handleGoConfirm = () => {
        setMessage(null);
        setError(null);

        if (!election || election.status !== 'OPEN') {
            setError('この選挙はオンライン投票の受付期間外です。');
            return;
        }
        if (!verified) {
            setError('本人認証が完了していません。');
            return;
        }
        if (selectedCandidateId == null || !selectedCandidate) {
            setError('候補者を選択してください。');
            return;
        }

        setConfirming(true);
    };

    // ★確定投票（ここで castVote）→ その後 /my/votes
    const handleConfirmSubmit = async () => {
        setMessage(null);
        setError(null);

        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!id) {
            setError('選挙IDが不正です。');
            return;
        }
        if (!election || election.status !== 'OPEN') {
            setError('この選挙はオンライン投票の受付期間外です。');
            return;
        }
        if (!verified) {
            setError('本人認証が完了していません。');
            return;
        }
        if (selectedCandidateId == null) {
            setError('候補者を選択してください。');
            return;
        }

        setSubmitting(true);
        try {
            await castVote(token, Number(id), selectedCandidateId);

            // ★投票完了 → 履歴へ（flashは任意。受け取る側で useLocation().state 参照）
            navigate('/my/votes', {
                state: { flash: '投票が完了しました。（再投票すると最後の票のみ有効になります）' },
            });
        } catch (err: any) {
            if (err?.message === 'unauthorized') {
                localStorage.removeItem('accessToken');
                navigate('/login');
                return;
            }
            setError(err?.message ?? '投票に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!election) return <p>選挙が見つかりません。</p>;

    return (
        <main>
            <h1>{election.name}</h1>

            {!verified ? (
                <>
                    <h2>本人認証</h2>
                    <p>デモ環境ではカードIDとPINで本人認証します。</p>

                    <div>
                        <div>
                            <label>
                                カードID：
                                <input
                                    value={cardId}
                                    onChange={(e) => setCardId(e.target.value)}
                                    placeholder="例：NTAG-0001"
                                    autoComplete="off"
                                />
                            </label>
                        </div>

                        <div>
                            <label>
                                暗証番号（PIN）：
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="例：1234"
                                    autoComplete="off"
                                />
                            </label>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <button onClick={handleVerify} disabled={verifying}>
                                {verifying ? '認証中...' : 'マイナンバーカードで認証（デモ）'}
                            </button>
                        </div>

                        {message && <p style={{ color: 'green' }}>{message}</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                    </div>
                </>
            ) : (
                <>
                    <p style={{ color: 'green' }}>本人認証：完了</p>

                    {myVote && (
                        <p>
                            現在の投票先：{myVote.candidateName}（{myVote.partyName ?? '無所属'}）
                        </p>
                    )}

                    {candidates.length === 0 ? (
                        <p>候補者が登録されていません。</p>
                    ) : confirming ? (
                        <>
                            <h2>投票内容の確認</h2>
                            <p>この内容で投票します。よろしいですか？</p>

                            <div>
                                <div>
                                    <strong>候補者：</strong>
                                    {selectedCandidate?.name}
                                </div>
                                <div>
                                    <strong>政党：</strong>
                                    {selectedCandidate?.partyName ?? '無所属'}
                                </div>
                                {selectedCandidate?.profile && (
                                    <div>
                                        <strong>プロフィール：</strong>
                                        {selectedCandidate.profile}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    disabled={submitting}
                                >
                                    戻る
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? '送信中...' : 'この内容で投票する'}
                                </button>
                            </div>

                            {message && <p style={{ color: 'green' }}>{message}</p>}
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </>
                    ) : (
                        <>
                            <h2>投票</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {candidates.map((c) => (
                                    <li key={c.id}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="candidate"
                                                value={c.id}
                                                checked={selectedCandidateId === c.id}
                                                onChange={() => setSelectedCandidateId(c.id)}
                                            />
                                            {c.name}（{c.partyName ?? '無所属'}）
                                            {c.profile ? ` - ${c.profile}` : ''}
                                        </label>
                                    </li>
                                ))}
                            </ul>

                            {/* ★ここだけ：ボタン名変更（挙動は確認へ） */}
                            <button onClick={handleGoConfirm}>投票履歴へ</button>

                            {message && <p style={{ color: 'green' }}>{message}</p>}
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </>
                    )}
                </>
            )}
        </main>
    );
}
