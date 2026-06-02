import { redirect } from "next/navigation";
import { createAdminClient } from "../../../utils/supabase/admin";
import TransactionsClient from "./TransactionsClient";

export default async function AdminTransactionsPage() {
  let supabase;

  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("Admin transactions init error:", error);
    redirect("/dashboard");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, stores(name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  return <TransactionsClient orders={orders || []} />;
}
