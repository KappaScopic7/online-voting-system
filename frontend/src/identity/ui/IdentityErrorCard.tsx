// frontend/src/identity/ui/IdentityErrorCard.tsx
import { Link } from "react-router-dom";
import { Card } from "../../shared/ui/page";

export function IdentityErrorCard(props: {
    err: string | null;
    onClose: () => void;
    backTo: string;
    busy?: boolean;
}) {
    const { err, onClose, backTo, busy } = props;
    if (!err) return null;

    return (
        <Card role="alert">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>エラー</div>
            <div style={{ marginBottom: 10 }}>{err}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={onClose} disabled={!!busy}>
                    閉じる
                </button>
                <Link to={backTo}>← 戻る</Link>
            </div>
        </Card>
    );
}
