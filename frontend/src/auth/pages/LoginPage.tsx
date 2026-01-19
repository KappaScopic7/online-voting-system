// auth/pages/LoginPage.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../AuthContext";

type LocationState = {
    email?: string;
};

export function LoginPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const { setAccessToken } = useAuth();
    const [email, setEmail] = useState(state.email ?? "");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        try {
            const token = await login(email, password);
            await setAccessToken(token.accessToken);
            nav("/");
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Login failed");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form
                onSubmit={onSubmit}
                style={{ display: "grid", gap: 8, maxWidth: 360 }}
            >
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email"
                    autoComplete="email"
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    type="password"
                    autoComplete="current-password"
                />
                <button type="submit">Login</button>
            </form>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
            <div style={{ marginTop: 16 }}>
                Raw JSON
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(
                        {
                            email,
                            password,
                            msg,
                            locationState: state,
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>
        </div>
    );
}
