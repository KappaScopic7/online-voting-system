// frontend/src/shared/ui/ErrorCard.tsx
import { Card } from "./page";

export function ErrorCard(props: {
    title?: string;
    message: string;
    actions?: React.ReactNode;
}) {
    const { title = "エラー", message, actions } = props;

    return (
        <Card role="alert">
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div style={{ fontWeight: 800 }}>{title}</div>
                    <div style={{ opacity: 0.9 }}>{message}</div>
                </div>
                {actions ? (
                    <div style={{ marginLeft: "auto" }}>{actions}</div>
                ) : null}
            </div>
        </Card>
    );
}
