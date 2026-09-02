import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/current-user";
import { TabBar, Sidebar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh">
      <Sidebar businessName={business.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pb-14 sm:pt-9">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
