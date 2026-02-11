// frontend/src/identity/components/IdentityMethodTabs.tsx
import React from "react";

export type IdentityMethod = "MANUAL" | "NFC";

export function IdentityMethodTabs(props: {
    value: IdentityMethod;
    onChange: (v: IdentityMethod) => void;

    nfcDisabled?: boolean;
    manualDisabled?: boolean;
}) {
    const {
        value,
        onChange,
        nfcDisabled = false,
        manualDisabled = false,
    } = props;

    const isDev = import.meta.env?.DEV;

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
            <button
                type="button"
                onClick={() => onChange("MANUAL")}
                disabled={manualDisabled}
                style={tabStyle(value === "MANUAL", manualDisabled)}
            >
                {isDev ? "手入力（デモ）" : "手入力"}
            </button>

            <button
                type="button"
                onClick={() => onChange("NFC")}
                disabled={nfcDisabled}
                style={tabStyle(value === "NFC", nfcDisabled)}
            >
                NFC
            </button>
        </div>
    );
}
