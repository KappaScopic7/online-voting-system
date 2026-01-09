// api/identity.ts
import { http } from "../../shared/http";

export async function linkIdentity(citizenId: string): Promise<void> {
  await http.post("/api/identity/link", { citizenId });
}
