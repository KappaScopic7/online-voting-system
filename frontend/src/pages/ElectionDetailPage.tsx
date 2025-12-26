// frontend/src/pages/ElectionDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchElectionDetail, ApiError } from '../api/authClient';
import type { ElectionDetail } from '../api/authClient';
import { formatDateTimeJa } from '../utils/date';
import { statusLabel } from '../domain/election';

type PageState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; detail: ElectionDetail };

export function ElectionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const electionId = useMemo(() => {
        if (!id) return null;
        const n = Number(id);
        if (!Number.isInteger(n) || n <= 0) return null;
        return n;
    }, [id]);

    const [state, setState] = useState<PageState>({ kind: 'loading' });

    useEffect(() => {
        if (electionId === null) {
            setState({ kind: 'error', message: '選挙IDが不正です。' });
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await fetchElectionDetail(electionId);
                if (cancelled) return;
                setState({ kind: 'ready', detail: data });
            } catch (e: unknown) {
                if (cancelled) return;

                // 401はProtectedRouteが吸う想定。ここで/login遷移しない。
                if (e instanceof ApiError && e.status === 403) {
                    setState({ kind: 'error', message: e.message });
                    return;
                }

                const message = e instanceof Error ? e.message : '選挙詳細の取得に失敗しました';
                setState({ kind: 'error', message });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [electionId]);

    if (state.kind === 'loading') return <p>読み込み中...</p>;
    if (state.kind === 'error') return <p style={{ color: 'red' }}>{state.message}</p>;

    const detail = state.detail;
    const isClosed = detail.status === 'CLOSED';
    const isOpen = detail.status === 'OPEN';

    return (
        <main>
            <h1>{detail.name}</h1>
            {detail.description && <p>{detail.description}</p>}

            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 8 }}>
                <dt>コード</dt>
                <dd>{detail.code}</dd>

                <dt>選挙区</dt>
                <dd>{detail.districtName}</dd>

                <dt>状態</dt>
                <dd>{statusLabel(detail.status)}</dd>

                <dt>開始日時</dt>
                <dd>{formatDateTimeJa(detail.startsAt)}</dd>

                <dt>終了日時</dt>
                <dd>{formatDateTimeJa(detail.endsAt)}</dd>
            </dl>

            {isOpen && (
                <button
                    style={{ marginTop: 16 }}
                    onClick={() => navigate(`/elections/${detail.id}/vote`)}
                >
                    この選挙で投票する
                </button>
            )}

            {isClosed && (
                <>
                    <p style={{ marginTop: 16, color: 'red' }}>
                        この選挙はすでに終了しているため、オンライン投票はできません。
                    </p>
                    <button
                        style={{ marginTop: 8 }}
                        onClick={() => navigate(`/elections/${detail.id}/result`)}
                    >
                        集計結果を見る
                    </button>
                </>
            )}
        </main>
    );
}
