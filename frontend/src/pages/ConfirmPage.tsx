import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiCastVote } from '../api/client';
import type { ApiError } from '../api/types';

type Candidate = { id: string; name: string };
type NavState = { candidate?: Candidate };

export default function ConfirmPage() {
    const nav = useNavigate();
    const { electionId } = useParams();
    const loc = useLocation() as unknown as { state?: NavState };
    const candidate = loc.state?.candidate;

    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    async function onVote() {
        // ここで型を確定させる（これがないとTSが落ちる）
        if (!electionId) {
            setErr('electionId missing');
            return;
        }
        if (!candidate) {
            setErr('candidate missing（候補選択画面から遷移してください）');
            return;
        }

        setBusy(true);
        setErr(null);
        try {
            await apiCastVote(electionId, candidate.id);
            nav('/done');
        } catch (e: any) {
            const ae = e as ApiError;
            setErr(`${ae.code}: ${ae.message}`);
        } finally {
            setBusy(false);
        }
    }

    // 表示側も安全に
    if (!electionId) return <div style={{ padding: 24 }}>electionId missing</div>;
    if (!candidate)
        return <div style={{ padding: 24 }}>candidate missing（候補選択から遷移してください）</div>;

    return (
        <div style={{ padding: 24 }}>
            <h2>投票確認</h2>

            <div style={{ border: '1px solid #ddd', padding: 12 }}>
                <div>投票先</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{candidate.name}</div>
            </div>

            <div style={{ marginTop: 12, color: '#444' }}>※ 投票確定後は取り消せません。</div>

            {err && <div style={{ color: 'crimson', marginTop: 12 }}>{err}</div>}

            <div style={{ marginTop: 16 }}>
                <button onClick={() => nav(-1)}>戻る</button>
                <button disabled={busy} style={{ marginLeft: 8 }} onClick={onVote}>
                    {busy ? '投票中...' : '投票する'}
                </button>
            </div>
        </div>
    );
}
