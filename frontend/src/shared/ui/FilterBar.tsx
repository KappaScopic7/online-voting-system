import React from "react";
import { Card } from "./page";

export function FilterBar(props: {
    value: string;
    onChange: (v: string) => void;

    placeholder?: string;
    right?: React.ReactNode; // 件数/ボタンなど
    left?: React.ReactNode; // チップ等（任意）

    disabled?: boolean;
}) {
    const { value, onChange, placeholder, right, left, disabled } = props;

    return (
        <Card>
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder ?? "検索"}
                    disabled={disabled}
                    style={{
                        flex: 1,
                        minWidth: 240,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e5e5",
                        background: disabled ? "#fafafa" : "#fff",
                    }}
                />

                {left ? <span>{left}</span> : null}

                {right ? (
                    <span
                        style={{
                            marginLeft: "auto",
                            display: "inline-flex",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                            fontSize: 12,
                            opacity: 0.75,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {right}
                    </span>
                ) : null}
            </div>
        </Card>
    );
}
