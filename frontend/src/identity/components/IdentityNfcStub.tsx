// frontend/src/identity/components/IdentityNfcStub.tsx
export function IdentityNfcStub() {
    return (
        <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>
                NFC読み取りは後で実装します。この枠がそのままNFCコンポーネントに置き換わります。
            </p>
            <button type="button" disabled title="準備中">
                NFCを読み取る（準備中）
            </button>
            <small style={{ opacity: 0.7 }}>
                実装方針：読み取り → payload生成 → /api/identity/link
                に送信（または専用endpoint）
            </small>
        </div>
    );
}
