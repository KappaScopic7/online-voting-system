import type { ReactNode } from "react";

export function StatusPill(props: { children: ReactNode; title?: string }) {
    const { children, title } = props;

    return (
        <span
            title={title}
            style={{
                fontSize: 12,
                padding: "2px 10px",
                border: "1px solid #eee",
                borderRadius: 999,
                background: "#fafafa",
                whiteSpace: "nowrap",
                opacity: 0.95,
            }}
        >
            {children}
        </span>
    );
}
