import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";
import { TabBar, Sidebar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.business) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh">
      <Sidebar businessName={ctx.business.name} role={ctx.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pb-14 sm:pt-9">
          {children}
        </main>
      </div>
      <TabBar role={ctx.role} />
    </div>
  );
}
