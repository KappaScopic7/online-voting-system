// frontend/src/identity/ui/IdentityPinStepCard.tsx
import { Card } from "../../shared/ui/page";
import { isPinValid } from "../utils/identityValidation";

export function IdentityPinStepCard(props: {
    pin: string;
    setPin: (v: string) => void;
    disabled?: boolean;
    onNext: () => void;
}) {
    const { pin, setPin, disabled, onNext } = props;
    const pinOk = isPinValid(pin);

    return (
        <Card>
            <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>
                    PIN（4桁）を入力してください
                </div>

                <input
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    placeholder="例: 1234"
                    value={pin}
                    onChange={(e) =>
                        setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
                    }
                    style={{ padding: 10, fontSize: 16, width: 180 }}
                    disabled={!!disabled}
                />

                {!pinOk && pin.length > 0 && (
                    <div style={{ fontSize: 12, color: "crimson" }}>
                        PINは4桁の数字で入力してください
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginTop: 4,
                    }}
                >
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!pinOk || !!disabled}
                        style={{ fontWeight: 700 }}
                    >
                        次へ →
                    </button>

                    <span style={{ fontSize: 12, opacity: 0.75 }}>
                        ※ PINはカード所持者確認のために必要です
                    </span>
                </div>
            </div>
        </Card>
    );
}
