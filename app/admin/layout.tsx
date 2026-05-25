import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../../components/admin/sidebar";
import { AdminHeader } from "../../components/admin/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Basic security check: user must be logged in and match the super admin email
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="h-screen max-h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-72 h-full border-r border-border bg-background/50 backdrop-blur-xl shrink-0">
        <AdminSidebar user={user} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <AdminHeader user={user} />

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
