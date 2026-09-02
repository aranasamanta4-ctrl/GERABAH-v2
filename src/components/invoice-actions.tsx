"use client";

import { useState } from "react";
import { IconDownload, IconShare } from "./icons";

export function InvoiceActions({ url, filename }: { url: string; filename: string }) {
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(true);

  async function share() {
    setSharing(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("gagal");
      const file = new File([await res.blob()], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        setCanShare(false);
        window.open(url, "_blank");
      }
    } catch (err) {
      // A share the user dismissed is not a failure worth reporting.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setCanShare(false);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <a href={`${url}?download=1`} className="btn btn-secondary">
        <IconDownload className="h-[18px] w-[18px]" />
        Unduh PDF
      </a>
      {canShare ? (
        <button onClick={share} disabled={sharing} className="btn btn-primary disabled:opacity-60">
          <IconShare className="h-[18px] w-[18px]" />
          {sharing ? "Menyiapkan…" : "Kirim"}
        </button>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">
          <IconShare className="h-[18px] w-[18px]" />
          Buka Invoice
        </a>
      )}
    </div>
  );
}
