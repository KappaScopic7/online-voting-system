// frontend/src/identity/ui/IdentityStepHeaderCard.tsx
import { Card } from "../../shared/ui/page";

export function IdentityStepHeaderCard(props: {
    stepLabel: string; // "STEP 1 / 2 ..." etc
    canWebNfc: boolean;
}) {
    const { stepLabel, canWebNfc } = props;

    return (
        <Card>
            <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>{stepLabel}</div>

                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.7 }}>
                    ・NFC または 手入力で本人認証できます
                    <br />
                    ・認証後は元の画面へ戻ります
                    <br />
                    ・PIN（4桁）はカード所持者確認のために必要です
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.75,
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid #eee",
                            background: "#fafafa",
                        }}
                    >
                        端末: {canWebNfc ? "Web NFC 対応" : "Web NFC 非対応"}
                    </span>

                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.75,
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid #eee",
                            background: "#fafafa",
                        }}
                    >
                        認証方法:{" "}
                        {canWebNfc
                            ? "NFC（かざす） / 手入力"
                            : "NFC（リーダ） / 手入力"}
                    </span>
                </div>
            </div>
        </Card>
    );
}
