// frontend/src/components/PageState.tsx
import type { ReactNode } from 'react';
import { InlineMessage } from './InlineMessage';

type Props = {
    loading?: boolean;
    fatalError?: string | null; // 画面が成立しないエラー
    notice?: string | null; // 見せて戻す系
    children: ReactNode;
    noticeActions?: ReactNode; // notice時のボタン等
};

export function PageState({ loading, fatalError, notice, children, noticeActions }: Props) {
    if (loading) return <p>読み込み中...</p>;

    if (fatalError) {
        return (
            <InlineMessage variant="error" title="エラー">
                {fatalError}
            </InlineMessage>
        );
    }

    if (notice) {
        return (
            <InlineMessage variant="notice" title="お知らせ" actions={noticeActions}>
                {notice}
            </InlineMessage>
        );
    }

    return <>{children}</>;
}
