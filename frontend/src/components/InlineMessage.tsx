// frontend/src/components/InlineMessage.tsx
import type { ReactNode } from 'react';

type Variant = 'error' | 'notice' | 'success';

type Props = {
    variant: Variant;
    title?: string;
    children: ReactNode;
    actions?: ReactNode;
};

const styleByVariant: Record<Variant, React.CSSProperties> = {
    error: {
        border: '1px solid #f5c2c7',
        background: '#f8d7da',
        color: '#842029',
    },
    notice: {
        border: '1px solid #ffe69c',
        background: '#fff3cd',
        color: '#664d03',
    },
    success: {
        border: '1px solid #badbcc',
        background: '#d1e7dd',
        color: '#0f5132',
    },
};

export function InlineMessage({ variant, title, children, actions }: Props) {
    return (
        <section style={{ ...base, ...styleByVariant[variant] }}>
            {title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>}
            <div>{children}</div>
            {actions && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>{actions}</div>}
        </section>
    );
}

const base: React.CSSProperties = {
    borderRadius: 8,
    padding: '12px 12px',
};
