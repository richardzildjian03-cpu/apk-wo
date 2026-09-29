"use server";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  homePathFor,
  verifyPassword,
} from "@/lib/auth";
import type { Role } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { redirect } from "next/navigation";

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Email dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, message: "Email atau password salah." };
  }

  await createSession({ id: user.id, nama: user.nama, role: user.role as Role });
  redirect(homePathFor(user.role as Role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
