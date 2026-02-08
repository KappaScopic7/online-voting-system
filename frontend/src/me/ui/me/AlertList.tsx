// frontend/src/me/ui/me/AlertList.tsx
export function AlertList(props: {
    items: {
        title: string;
        body: string;
        cta?: React.ReactNode;
    }[];
}) {
    const { items } = props;
    if (items.length === 0) return null;

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {items.map((a, i) => (
                <div
                    key={i}
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fafafa",
                        display: "grid",
                        gap: 6,
                    }}
                >
                    <div style={{ fontWeight: 900 }}>{a.title}</div>
                    <div
                        style={{
                            fontSize: 13,
                            opacity: 0.85,
                            lineHeight: 1.6,
                        }}
                    >
                        {a.body}
                    </div>
                    {a.cta ? <div style={{ marginTop: 4 }}>{a.cta}</div> : null}
                </div>
            ))}
        </div>
    );
}
