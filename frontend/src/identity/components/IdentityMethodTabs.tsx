// frontend/src/identity/components/IdentityMethodTabs.tsx
import React from "react";

export type IdentityMethod = "MANUAL" | "NFC";

export function IdentityMethodTabs(props: {
    value: IdentityMethod;
    onChange: (v: IdentityMethod) => void;
}) {
    const { value, onChange } = props;

    const isDev = import.meta.env?.DEV;

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: 8,
        background: active ? "#f5f5f5" : "transparent",
        cursor: "pointer",
        userSelect: "none",
        opacity: active ? 1 : 0.85,
    });

    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
                type="button"
                onClick={() => onChange("MANUAL")}
                style={tabStyle(value === "MANUAL")}
            >
                {isDev ? "手入力（デモ）" : "手入力"}
            </button>

            <button
                type="button"
                onClick={() => onChange("NFC")}
                style={tabStyle(value === "NFC")}
            >
                NFC
            </button>
        </div>
    );
}
