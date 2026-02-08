// frontend/src/elections/ui/ElectionMetaCard.tsx
import { Card } from "../../shared/ui/page";
import { formatJST, statusLabel } from "../../shared/elections/format";
import type { ElectionDetailResponse } from "../model/electionTypes";

export function ElectionMetaCard({ data }: { data: ElectionDetailResponse }) {
    return (
        <Card>
            <div style={{ display: "grid", gap: 8 }}>
                <div style={{ opacity: 0.9 }}>
                    状態: <b>{statusLabel(data.status as any)}</b>
                </div>
                <div style={{ opacity: 0.9 }}>
                    期間: {formatJST(data.startsAt)} 〜 {formatJST(data.endsAt)}
                </div>
                <div style={{ opacity: 0.9 }}>
                    候補者数: <b>{data.candidateCount}</b>
                </div>
            </div>
        </Card>
    );
}
