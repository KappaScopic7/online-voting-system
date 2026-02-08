// frontend/src/me/ui/me/Badge.tsx
export function Badge(props: {
    children: React.ReactNode;
    tone?: "neutral" | "good" | "warn" | "bad";
}) {
    const { children, tone = "neutral" } = props;

    const bg =
        tone === "good"
            ? "#ecfdf3"
            : tone === "warn"
              ? "#fff7ed"
              : tone === "bad"
                ? "#fef2f2"
                : "#f5f5f5";
    const bd =
        tone === "good"
            ? "#bbf7d0"
            : tone === "warn"
              ? "#fed7aa"
              : tone === "bad"
                ? "#fecaca"
                : "#e5e5e5";
    const fg =
        tone === "good"
            ? "#166534"
            : tone === "warn"
              ? "#9a3412"
              : tone === "bad"
                ? "#991b1b"
                : "#444";

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${bd}`,
                background: bg,
                color: fg,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
}
