// frontend/src/pages/VotePage.tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    fetchElectionDetail,
    fetchCandidates,
    fetchMyVote,
    castVote,
    fetchMyVerification,
    verifyIdentity,
    ApiError,
} from '../api/authClient';
import type { Candidate, MyVote, ElectionDetail } from '../api/authClient';

type Step = 'VOTE' | 'CONFIRM' | 'DONE';

export function VotePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const electionId = useMemo(() => {
        if (!id) return null;
        const n = Number(id);
        if (!Number.isInteger(n) || n <= 0) return null;
        return n;
    }, [id]);

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

    const [step, setStep] = useState<Step>('VOTE');

    const [message, setMessage] = useState<string | null>(null);

    const [fatalError, setFatalError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const selectedCandidate = useMemo(() => {
        if (selectedCandidateId == null) return null;
        return candidates.find((c) => c.id === selectedCandidateId) ?? null;
    }, [selectedCandidateId, candidates]);

    const reloadVoteUI = useCallback(async () => {
        if (electionId == null) return;

        try {
            const [candidates, myVote] = await Promise.all([
                fetchCandidates(electionId),
                fetchMyVote(electionId),
            ]);

            setActionError(null);

            setCandidates(candidates);
            setMyVote(myVote);

            if (myVote) {
                setSelectedCandidateId(myVote.candidateId);
            }
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                if (e.status === 401) return;

                if (e.status === 403) {
                    setActionError(e.message || '候補者情報を取得できません。');
                    return;
                }

                setActionError(e.message);
                return;
            }

            setActionError(e instanceof Error ? e.message : '候補者情報の取得に失敗しました');
        }
    }, [electionId]);

    useEffect(() => {
        if (electionId == null) {
            setFatalError('選挙IDが不正です。');
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const detail = await fetchElectionDetail(electionId);
                if (cancelled) return;

                setElection(detail);

                if (detail.status !== 'OPEN') {
                    setFatalError('この選挙はオンライン投票の受付期間外です。');
                    return;
                }

                const status = await fetchMyVerification(electionId);

                if (cancelled) return;

                setVerified(status.verified);

                if (status.verified) {
                    await reloadVoteUI();
                }
            } catch (e: unknown) {
                if (cancelled) return;

                if (e instanceof ApiError) {
                    if (e.status === 403) {
                        setFatalError(e.message || 'この選挙では投票できません。');
                        return;
                    }
                    setFatalError(e.message);
                    return;
                }

                setFatalError(e instanceof Error ? e.message : '情報の取得に失敗しました');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [electionId, reloadVoteUI]);

    const handleVerify = async () => {
        setMessage(null);
        setActionError(null);

        if (electionId == null) {
            setFatalError('選挙IDが不正です。');
            return;
        }
        if (!election || election.status !== 'OPEN') {
            setFatalError('この選挙はオンライン投票の受付期間外です。');
            return;
        }

        if (!cardId.trim()) {
            setActionError('カードIDを入力してください。');
            return;
        }
        if (!pin.trim()) {
            setActionError('暗証番号（PIN）を入力してください。');
            return;
        }

        setVerifying(true);
        try {
            await verifyIdentity(electionId, { cardId: cardId.trim(), pin: pin.trim() });

            const status = await fetchMyVerification(electionId);
            setVerified(status.verified);

            if (!status.verified) {
                setActionError('本人認証に失敗しました。');
                return;
            }

            setMessage('本人認証が完了しました。投票を続行できます。');
            setCardId('');
            setPin('');
            await reloadVoteUI();
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                if (e.status === 401) return;
                if (e.status === 403) {
                    setActionError(e.message || '本人認証を完了できません。');
                    return;
                }
                setActionError(e.message);
                return;
            }
            setActionError(e instanceof Error ? e.message : '本人認証に失敗しました');
        } finally {
            setVerifying(false);
        }
    };

    const handleGoConfirm = () => {
        setMessage(null);
        setActionError(null);

        if (!election || election.status !== 'OPEN') {
            setFatalError('この選挙はオンライン投票の受付期間外です。');
            return;
        }
        if (!verified) {
            setActionError('本人認証が完了していません。');
            return;
        }
        if (selectedCandidateId == null || !selectedCandidate) {
            setActionError('候補者を選択してください。');
            return;
        }

        setStep('CONFIRM');
    };

    const handleConfirmSubmit = async () => {
        setMessage(null);
        setActionError(null);

        if (submitting) return;

        if (electionId == null) {
            setFatalError('選挙IDが不正です。');
            return;
        }
        if (!election || election.status !== 'OPEN') {
            setFatalError('この選挙はオンライン投票の受付期間外です。');
            return;
        }
        if (!verified) {
            setActionError('本人認証が完了していません。');
            return;
        }
        if (selectedCandidateId == null) {
            setActionError('候補者を選択してください。');
            return;
        }

        setSubmitting(true);
        try {
            await castVote(electionId, selectedCandidateId);
            setStep('DONE');

            const my = await fetchMyVote(electionId);
            setMyVote(my);

            setMessage('投票が完了しました。（再投票すると最後の票のみ有効になります）');
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                if (e.status === 401) return;
                if (e.status === 403) {
                    setActionError(e.message || 'この選挙では投票できません。');
                    return;
                }
                setActionError(e.message);
                return;
            }
            setActionError(e instanceof Error ? e.message : '投票に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p>読み込み中...</p>;
    if (fatalError) return <p style={{ color: 'red' }}>{fatalError}</p>;
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
                        {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
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
                    ) : step === 'DONE' ? (
                        <>
                            <h2>投票完了</h2>
                            <p>投票が正常に受理されました。</p>
                            {message && <p style={{ color: 'green' }}>{message}</p>}

                            <div
                                style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}
                            >
                                <button type="button" onClick={() => navigate('/')}>
                                    ホームへ
                                </button>
                                <button type="button" onClick={() => navigate('/my-elections')}>
                                    My選挙一覧へ
                                </button>
                                <button type="button" onClick={() => navigate('/my/votes')}>
                                    投票履歴へ
                                </button>
                            </div>
                        </>
                    ) : step === 'CONFIRM' ? (
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
                                    onClick={() => setStep('VOTE')}
                                    disabled={submitting}
                                >
                                    戻る
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? '送信中...' : '投票する'}
                                </button>
                            </div>

                            {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
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

                            <button onClick={handleGoConfirm}>投票内容を確認</button>

                            {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
                        </>
                    )}
                </>
            )}
        </main>
    );
}
