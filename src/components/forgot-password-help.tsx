"use client";

import { useState } from "react";
import { waUrl } from "@/lib/whatsapp";
import { IconMessage } from "./icons";

export function ForgotPasswordHelp({ adminWhatsapp }: { adminWhatsapp: string }) {
  const [email, setEmail] = useState("");

  const link = waUrl(
    adminWhatsapp,
    `Halo Admin GERABAH, saya lupa kata sandi akun saya.\nEmail akun: ${email || "(tulis email kamu di sini)"}\nMohon dibantu atur ulang. Terima kasih.`
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-help">
        Atur ulang kata sandi dilakukan oleh admin. Kirim email akunmu ke admin lewat WhatsApp, nanti admin membuatkan
        kata sandi sementara untukmu.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-ink-2">Email akunmu</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="nama@email.com"
        />
      </label>

      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary w-full">
          <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
          Hubungi Admin via WhatsApp
        </a>
      ) : (
        <p className="rounded-[var(--radius-md)] bg-warn-soft px-4 py-3 text-[13.5px] font-medium text-warn">
          Nomor admin belum diatur. Hubungi pengelola aplikasi untuk atur ulang kata sandi.
        </p>
      )}
    </div>
  );
}
