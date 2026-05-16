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

  // Fetch the user's store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="h-screen max-h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-72 h-full border-r border-border bg-background/50 backdrop-blur-xl shrink-0">
        <Sidebar user={user} store={store} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header user={user} store={store} />

        {/* Main Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
