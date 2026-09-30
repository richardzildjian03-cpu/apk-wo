import { getSettings } from "@/lib/settings";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { updateBrandingAction, updateTextSettingsAction } from "@/lib/actions/settings";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PageHeader, Card } from "@/components/ui";

export const metadata = { title: "Pengaturan" };

const SETTINGS_META: Record<string, { label: string; placeholder: string; type?: string }> = {
  site_name: { label: "Nama Situs", placeholder: "DekorLamaran" },
  site_tagline: { label: "Tagline", placeholder: "Wedding Organizer Management" },
  footer_invitation: { label: "Teks Footer Undangan", placeholder: "Undangan digital ini dikelola melalui DekorLamaran", type: "textarea" },
  wa_support: { label: "No. WA Admin", placeholder: "08xxxxxxxxxx" },
  instagram: { label: "Instagram", placeholder: "@dekorlamaran" },
  website: { label: "Website", placeholder: "https://dekorlamaran.id" },
  company_name: { label: "Nama Usaha", placeholder: "PT DekorLamaran Indonesia" },
  company_address: { label: "Alamat", placeholder: "Jl. Contoh No. 123, Jakarta", type: "textarea" },
  company_phone: { label: "Telepon", placeholder: "021-1234567" },
};

export default async function SettingsPage() {
  await requireRole(ROLES.BOS, ROLES.STAFF);

  const settings = await getSettings();
  const hasLogo = !!settings.logo_path;

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi branding, undangan digital, kontak, dan informasi bisnis"
      />

      <div className="grid gap-6">
        {/* Section 1: Branding */}
        <Card title="Branding & Logo">
          <ActionForm action={updateBrandingAction} multipart className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              {hasLogo ? (
                <div className="flex items-center gap-4 rounded-lg border border-pink-100 bg-pink-50/50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logo_path}
                    alt="Logo saat ini"
                    className="h-14 w-14 rounded-xl object-contain"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Logo saat ini</p>
                    <p className="text-xs text-zinc-500">{settings.logo_path}</p>
                    <label className="mt-2 flex items-center gap-2 text-xs text-red-600">
                      <input type="checkbox" name="hapusLogo" className="accent-red-600" />
                      Hapus logo (kembali ke teks)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-xs text-zinc-400">
                  Belum ada logo — akan ditampilkan sebagai teks &quot;DekorLamaran&quot;
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label">
                Upload Logo Baru (JPG/PNG/WebP, maks 4MB, rasio 1:1 disarankan)
              </label>
              <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
            </div>
            <div>
              <label className="label">{SETTINGS_META.site_name.label}</label>
              <input
                name="site_name"
                className="input"
                defaultValue={settings.site_name}
                placeholder={SETTINGS_META.site_name.placeholder}
                required
              />
            </div>
            <div>
              <label className="label">{SETTINGS_META.site_tagline.label}</label>
              <input
                name="site_tagline"
                className="input"
                defaultValue={settings.site_tagline}
                placeholder={SETTINGS_META.site_tagline.placeholder}
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Simpan Branding</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        {/* Section 2: Undangan Digital */}
        <Card title="Undangan Digital">
          <ActionForm action={updateTextSettingsAction} className="space-y-4">
            <div>
              <label className="label">{SETTINGS_META.footer_invitation.label}</label>
              <textarea
                name="footer_invitation"
                rows={2}
                className="input"
                defaultValue={settings.footer_invitation}
                placeholder={SETTINGS_META.footer_invitation.placeholder}
              />
              <p className="mt-1 text-xs text-zinc-400">
                Teks ini tampil di bagian bawah halaman undangan digital tamu.
              </p>
            </div>
            <SubmitButton>Simpan Pengaturan Undangan</SubmitButton>
          </ActionForm>
        </Card>

        {/* Section 3: Kontak & Sosial Media */}
        <Card title="Kontak & Sosial Media">
          <ActionForm action={updateTextSettingsAction} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">{SETTINGS_META.wa_support.label}</label>
              <input
                name="wa_support"
                className="input"
                defaultValue={settings.wa_support}
                placeholder={SETTINGS_META.wa_support.placeholder}
              />
            </div>
            <div>
              <label className="label">{SETTINGS_META.instagram.label}</label>
              <input
                name="instagram"
                className="input"
                defaultValue={settings.instagram}
                placeholder={SETTINGS_META.instagram.placeholder}
              />
            </div>
            <div>
              <label className="label">{SETTINGS_META.website.label}</label>
              <input
                name="website"
                className="input"
                defaultValue={settings.website}
                placeholder={SETTINGS_META.website.placeholder}
              />
            </div>
            <div className="md:col-span-3">
              <SubmitButton>Simpan Kontak</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        {/* Section 4: Informasi Bisnis */}
        <Card title="Informasi Bisnis">
          <ActionForm action={updateTextSettingsAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">{SETTINGS_META.company_name.label}</label>
              <input
                name="company_name"
                className="input"
                defaultValue={settings.company_name}
                placeholder={SETTINGS_META.company_name.placeholder}
              />
            </div>
            <div>
              <label className="label">{SETTINGS_META.company_phone.label}</label>
              <input
                name="company_phone"
                className="input"
                defaultValue={settings.company_phone}
                placeholder={SETTINGS_META.company_phone.placeholder}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{SETTINGS_META.company_address.label}</label>
              <textarea
                name="company_address"
                rows={2}
                className="input"
                defaultValue={settings.company_address}
                placeholder={SETTINGS_META.company_address.placeholder}
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Simpan Informasi Bisnis</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}