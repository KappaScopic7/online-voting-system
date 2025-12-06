// frontend/src/api/authClient.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

export type MyElection = {
  electionId: number;
  code: string;
  name: string;
  districtName: string;
  status: "DRAFT" | "PUBLISHED" | "OPEN" | "CLOSED";
  startsAt: string;
  endsAt: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/voters/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "ログインに失敗しました");
  }

  return res.json();
}

export async function fetchMyElections(token: string): Promise<MyElection[]> {
  const res = await fetch(`${API_BASE}/api/voters/my-elections`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "My選挙一覧の取得に失敗しました");
  }

  return res.json();
}
