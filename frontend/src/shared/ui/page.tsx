// frontend/src/shared/ui/page.tsx
import type { ReactNode } from "react";

export function Page({
    title,
    actions,
    children,
}: {
    title?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    maxWidth?: number;
}) {
    return (
        <div
            style={{
                display: "grid",
                gap: 12,
            }}
        >
            {(title || actions) && (
                <header
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    {title ? <div>{title}</div> : <div />}
                    {actions ? <div>{actions}</div> : null}
                </header>
            )}
            {children}
        </div>
    );
}

export function Card({
    children,
    role,
}: {
    children: ReactNode;
    role?: string;
}) {
    return (
        <div
            role={role}
            style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
            }}
        >
            {children}
        </div>
    );
}

export function DevDebug({
    value,
    label = "Debug",
}: {
    value: unknown;
    label?: string;
}) {
    const isDev = import.meta.env?.DEV;
    if (!isDev) return null;

    return (
        <details>
            <summary>{label}</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(value, null, 2)}
            </pre>
        </details>
    );
}
