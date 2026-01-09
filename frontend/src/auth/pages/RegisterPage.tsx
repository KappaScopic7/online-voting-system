// pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await register(email, password);
      nav("/login");
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Register failed");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 8, maxWidth: 360 }}
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
        />
        <button type="submit">Create</button>
      </form>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
