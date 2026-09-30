"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { refreshSettings, getSetting } from "@/lib/settings";
import { saveSettingLogo, deleteSettingLogo } from "@/lib/uploads";
import type { ActionState } from "@/lib/types";

async function upsertSettings(
  entries: Record<string, string>,
): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  refreshSettings();
}

export async function updateBrandingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const siteName = String(formData.get("site_name") ?? "").trim();
    const siteTagline = String(formData.get("site_tagline") ?? "").trim();
    const hapusLogo = formData.get("hapusLogo") === "on";
    const file = formData.get("logo");

    if (!siteName) return { ok: false, message: "Nama situs wajib diisi." };

    const entries: Record<string, string> = {
      site_name: siteName,
      site_tagline: siteTagline,
    };

    let currentLogo = await getSetting("logo_path");

    if (hapusLogo) {
      await deleteSettingLogo(currentLogo);
      entries.logo_path = "";
      currentLogo = "";
    }

    if (file instanceof File && file.size > 0) {
      const res = await saveSettingLogo(file);
      if (!res.ok) return { ok: false, message: res.error };
      if (currentLogo && currentLogo !== res.publicPath) {
        await deleteSettingLogo(currentLogo);
      }
      entries.logo_path = res.publicPath;
    }

    await upsertSettings(entries);
    return { ok: true, message: "Branding berhasil diperbarui." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}

export async function updateTextSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  try {
    const keys = [
      "footer_invitation",
      "wa_support",
      "instagram",
      "website",
      "company_name",
      "company_address",
      "company_phone",
    ];

    const entries: Record<string, string> = {};
    for (const key of keys) {
      const val = formData.get(key);
      if (val !== null) entries[key] = String(val).trim();
    }

    await upsertSettings(entries);
    return { ok: true, message: "Pengaturan berhasil disimpan." };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan." };
  }
}