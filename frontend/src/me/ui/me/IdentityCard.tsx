// frontend/src/me/ui/me/IdentityCard.tsx
import { Link } from "react-router-dom";
import { Card } from "../../../shared/ui/page";

export function IdentityCard(props: {
    isLinked: boolean;
    isPending: boolean;
    returnTo: string;
}) {
    const { isLinked, isPending, returnTo } = props;

    return (
        <Card>
            <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>本人認証</div>

                {isLinked ? (
                    <div style={{ fontSize: 13 }}>
                        現在: <b>投票可能（本人認証済み）</b>
                    </div>
                ) : isPending ? (
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontSize: 13 }}>
                            現在: <b>投票不可（審査中）</b>
                        </div>
                        <Link
                            to="/me/identity/pending"
                            state={{ from: returnTo }}
                        >
                            審査状況を見る →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontSize: 13 }}>
                            現在: <b>投票不可（本人認証が必要）</b>
                        </div>
                        <Link to="/me/identity" state={{ from: returnTo }}>
                            本人認証へ進む →
                        </Link>
                    </div>
                )}
            </div>
        </Card>
    );
}
