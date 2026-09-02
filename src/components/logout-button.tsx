"use client";

import { logout } from "@/lib/actions/auth";
import { IconLogout } from "./icons";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="btn btn-secondary w-full text-bad">
        <IconLogout className="h-4 w-4" strokeWidth={2} />
        Keluar
      </button>
    </form>
  );
}
