import { createAdminClient } from "../../../utils/supabase/admin";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ExternalLink, Store } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function AdminMerchantsPage() {
  let supabase;

  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Admin merchants init error:", error);
    redirect("/dashboard");
  }

  // Fetch all stores, ordered by newest first
  const { data: stores, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching stores:", error);
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Merchants & Stores
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All registered users and their storefronts on the platform.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Store</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores && stores.length > 0 ? (
                stores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          {store.logo ? (
                            <Image
                              src={store.logo}
                              alt={store.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {store.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{store.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {store.whatsapp
                            ? `+${store.whatsapp}`
                            : "No WhatsApp"}
                        </span>
                        {/* We don't have user emails linked directly in the stores table, we'd need to fetch auth users for that, but this is a start */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(store.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/store/${store.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-border transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Visit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No merchants found.
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
