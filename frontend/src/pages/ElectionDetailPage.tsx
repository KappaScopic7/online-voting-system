// frontend/src/pages/ElectionDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchElectionDetail, ApiError } from '../api/authClient';
import type { ElectionDetail } from '../api/authClient';
import { formatDateTimeJa } from '../utils/date';
import { statusLabel } from '../domain/election';
import { PageState } from '../components/PageState';

export function ElectionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const electionId = useMemo(() => {
        if (!id) return null;
        const n = Number(id);
        if (!Number.isInteger(n) || n <= 0) return null;
        return n;
    }, [id]);

    const [detail, setDetail] = useState<ElectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [fatalError, setFatalError] = useState<string | null>(null);

    useEffect(() => {
        if (electionId == null) {
            setFatalError('選挙IDが不正です。');
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await fetchElectionDetail(electionId);
                if (cancelled) return;
                setDetail(data);
            } catch (e: unknown) {
                if (cancelled) return;

                let msg = '選挙詳細の取得に失敗しました';

                if (e instanceof ApiError) {
                    if (e.status === 404) msg = '指定された選挙は存在しません。';
                    else if (e.status === 403) msg = e.message || '閲覧権限がありません。';
                    else msg = e.message;
                } else if (e instanceof Error) {
                    msg = e.message;
                }

                setFatalError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [electionId]);

    const isOpen = detail?.status === 'OPEN';
    const isClosed = detail?.status === 'CLOSED';

    return (
        <main>
            <PageState loading={loading} fatalError={fatalError} notice={null}>
                {!detail ? (
                    <p>選挙が見つかりません。</p>
                ) : (
                    <>
                        <h1>{detail.name}</h1>
                        {detail.description && <p>{detail.description}</p>}

                        <dl
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'max-content 1fr',
                                gap: 8,
                            }}
                        >
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
                    </>
                )}
            </PageState>
        </main>
    );
}
