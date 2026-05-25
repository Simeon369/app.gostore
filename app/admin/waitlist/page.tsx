import { createAdminClient } from "../../../utils/supabase/admin";
import { formatDistanceToNow } from "date-fns";

export default async function AdminWaitlistPage() {
  const supabase = createAdminClient();

  // Fetch waitlist entries with explicit columns
  const { data: waitlist, error } = await supabase
    .from("waitlist")
    .select("id, phone, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching waitlist:", error);
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Waitlist Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          People who have signed up for early access on the landing page.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {waitlist && waitlist.length > 0 ? (
                waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">+{entry.phone}</span>
                        <span className="text-xs text-muted-foreground">{entry.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {entry.created_at ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) : "‑"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://wa.me/${entry.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                      >
                        Message
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No waitlist entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
