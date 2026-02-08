// frontend/src/me/ui/me/MeHeaderActions.tsx
import { Link } from "react-router-dom";

export function MeHeaderActions(props: {
    returnTo: string;
    refreshing: boolean;
    onReload: () => void;
}) {
    const { returnTo, refreshing, onReload } = props;

    return (
        <div
            style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
            }}
        >
            <Link to={returnTo}>← 戻る</Link>
            <button type="button" onClick={onReload} disabled={refreshing}>
                {refreshing ? "更新中..." : "再読み込み"}
            </button>
        </div>
    );
}
