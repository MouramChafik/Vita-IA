"use server";
// Connexion / déconnexion de la page Supervision (Server Functions, exécutées côté serveur).
// Le mot de passe est ADMIN_PASSWORD dans .env.local. Le cookie est httpOnly :
// le JavaScript de la page ne peut pas le lire.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, passwordMatches } from "@/lib/admin";

export async function login(formData: FormData) {
  const token = adminToken();
  if (token && passwordMatches(String(formData.get("password") ?? ""))) {
    (await cookies()).set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/supervision",
      maxAge: 8 * 3600,
    });
    redirect("/supervision");
  }
  redirect("/supervision?erreur=1");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/supervision" });
  redirect("/supervision");
}
