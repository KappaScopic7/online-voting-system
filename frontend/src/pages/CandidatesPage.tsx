import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiListCandidates } from '../api/client';
import type { ApiError, CandidateItem } from '../api/types';

export default function CandidatesPage() {
    const nav = useNavigate();
    const { electionId } = useParams();
    const [items, setItems] = React.useState<CandidateItem[]>([]);
    const [selected, setSelected] = React.useState<CandidateItem | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            if (!electionId) return;
            setErr(null);
            try {
                setItems(await apiListCandidates(electionId));
            } catch (e: any) {
                const ae = e as ApiError;
                setErr(`${ae.code}: ${ae.message}`);
            }
        })();
    }, [electionId]);

    if (!electionId) return <div style={{ padding: 24 }}>electionId missing</div>;

    return (
        <div style={{ padding: 24 }}>
            <h2>候補者選択</h2>
            {err && <div style={{ color: 'crimson' }}>{err}</div>}

            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {items.map((c) => (
                    <label key={c.id} style={{ border: '1px solid #ddd', padding: 8 }}>
                        <input
                            type="radio"
                            name="candidate"
                            checked={selected?.id === c.id}
                            onChange={() => setSelected(c)}
                            style={{ marginRight: 8 }}
                        />
                        {c.name}
                    </label>
                ))}
            </div>

            <div style={{ marginTop: 16 }}>
                <button onClick={() => nav('/elections')}>戻る</button>
                <button
                    style={{ marginLeft: 8 }}
                    disabled={!selected}
                    onClick={() =>
                        nav(`/elections/${electionId}/confirm`, { state: { candidate: selected } })
                    }
                >
                    確認へ
                </button>
            </div>
        </div>
    );
}
