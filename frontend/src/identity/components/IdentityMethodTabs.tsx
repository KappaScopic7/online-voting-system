// frontend/src/identity/components/IdentityMethodTabs.tsx
import React from "react";

export type IdentityMethod = "MANUAL" | "NFC";

// function isManualDemoEnabled(): boolean {
//     const sp = new URLSearchParams(window.location.search);
//     return sp.get("demo") === "1" || sp.get("manual") === "1";
// }

export function IdentityMethodTabs(props: {
    value: IdentityMethod;
    onChange: (v: IdentityMethod) => void;

    nfcDisabled?: boolean;
    manualDisabled?: boolean;

    allowManual?: boolean;
}) {
    const {
        value,
        onChange,
        nfcDisabled = false,
        manualDisabled = false,
        // allowManual = false,
    } = props;

    // const manualEnabled = allowManual || isManualDemoEnabled();

    const tabStyle = (
        active: boolean,
        disabled: boolean,
    ): React.CSSProperties => ({
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: 8,
        background: active ? "#f5f5f5" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        opacity: disabled ? 0.45 : active ? 1 : 0.85,
    });

    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* ✅ ふだんは NFC だけ */}
            <button
                type="button"
                onClick={() => onChange("NFC")}
                disabled={nfcDisabled}
                style={tabStyle(value === "NFC", nfcDisabled)}
            >
                NFC
            </button>

            <button
                type="button"
                onClick={() => onChange("MANUAL")}
                disabled={manualDisabled}
                style={tabStyle(value === "MANUAL", manualDisabled)}
            >
                手入力（デモ）
            </button>
        </div>
    );
}
