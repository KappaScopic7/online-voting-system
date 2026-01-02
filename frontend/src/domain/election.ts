// frontend/src/domain/election.ts
export type ElectionStatus = 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED';

export function statusLabel(status: ElectionStatus): string {
    switch (status) {
        case 'DRAFT':
            return '下書き';
        case 'PUBLISHED':
            return '公開中';
        case 'OPEN':
            return '受付中';
        case 'CLOSED':
            return '終了';
        default:
            return status;
    }
}
