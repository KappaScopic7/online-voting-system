// frontend/src/shared/ui/CollapsibleFilter.tsx
import { useId, useMemo, useState } from "react";
import { Card } from "./page";

export function CollapsibleFilter(props: {
    title?: string; // ボタン表示
    defaultOpen?: boolean; // 初期展開
    right?: React.ReactNode; // 右側に置きたいもの（件数とか）
    children: React.ReactNode;
}) {
    const { title = "絞り込み", defaultOpen = false, right, children } = props;

    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();

    const buttonLabel = useMemo(() => {
        // 開閉でアイコンだけ変えたいならここを調整
        return open ? "▲" : "▼";
    }, [open]);

    return (
        <Card>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() => setOpen((v) => !v)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "rgba(0,0,0,0.03)",
                        cursor: "pointer",
                    }}
                >
                    <span style={{ fontWeight: 700 }}>{title}</span>
                    <span style={{ opacity: 0.75, fontSize: 12 }}>
                        {buttonLabel}
                    </span>
                </button>

                {right ? (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{right}</div>
                ) : (
                    <span />
                )}
            </div>

            {open && (
                <div id={contentId} style={{ marginTop: 12 }}>
                    {children}
                </div>
            )}
        </Card>
    );
}
