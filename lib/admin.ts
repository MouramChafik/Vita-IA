// Vérification de l'accès administrateur (page Supervision). Module serveur uniquement.
// Volontairement HORS du fichier "use server" : toute fonction exportée d'un fichier
// "use server" devient appelable depuis le navigateur, ce qui exposerait le jeton.

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vita_admin";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Le cookie contient l'empreinte SHA-256 du mot de passe, jamais le mot de passe lui-même
export function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password ? sha256(password) : null;
}

// Comparaison à temps constant : ne révèle pas combien de caractères sont justes
export function sameToken(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function passwordMatches(password: string): boolean {
  const expected = adminToken();
  return expected !== null && sameToken(sha256(password), expected);
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminToken();
  const received = (await cookies()).get(ADMIN_COOKIE)?.value;
  return expected !== null && received !== undefined && sameToken(received, expected);
}
