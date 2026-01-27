// src/ui/AppShell.tsx
import type { ReactNode } from "react";

export function Page({
    title,
    actions,
    children,
}: {
    title: string;
    actions?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="page">
            <header className="pageHeader">
                <h2 className="pageTitle">{title}</h2>
                <div className="pageActions">{actions}</div>
            </header>
            <div className="pageBody">{children}</div>
        </div>
    );
}

export function Card({ children }: { children: ReactNode }) {
    return <section className="card">{children}</section>;
}

export function Alert({ children }: { children: ReactNode }) {
    return (
        <div className="alert" role="alert">
            {children}
        </div>
    );
}

export function ButtonRow({ children }: { children: ReactNode }) {
    return <div className="buttonRow">{children}</div>;
}
