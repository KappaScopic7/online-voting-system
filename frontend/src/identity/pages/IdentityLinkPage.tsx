// pages/IdentityLinkPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../shared/http";
import { useAuth } from "../../auth/AuthContext";

export function IdentityLinkPage() {
  const nav = useNavigate();
  const { refreshMe } = useAuth();
  const [citizenId, setCitizenId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await http.post("/api/identity/link", { citizenId });
      await refreshMe();
      nav("/");
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? "Link failed");
    }
  };

  return (
    <div>
      <h2>Link Identity</h2>
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 8, maxWidth: 420 }}
      >
        <input
          value={citizenId}
          onChange={(e) => setCitizenId(e.target.value)}
          placeholder="citizenId (uuid)"
        />
        <button type="submit">Link</button>
      </form>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
