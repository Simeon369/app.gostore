import { Sidebar } from "../../components/dashboard/sidebar";
import { Header } from "../../components/dashboard/header";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-72 h-screen sticky top-0 border-r border-border bg-background/50 backdrop-blur-xl">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header user={user} />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
