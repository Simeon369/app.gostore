import Link from "next/link";
import { Rocket } from "lucide-react";
import { getLoginUrl, getStoreUrl } from "@/lib/urls";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const settings = await getPlatformSettings();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-[32px] p-8 flex flex-col gap-6 text-center shadow-2xl">
        <div className="mx-auto p-4 rounded-2xl bg-primary/10 text-primary w-fit">
          <Rocket className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground">GoStore Beta</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {settings.signup_enabled
              ? "Create your store on GoStore. You will need a valid invite code from the GoStore team."
              : "Signup is temporarily closed. If you already have an invite code, check back soon or contact the GoStore team."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {settings.signup_enabled ? (
            <Link
              href="/signup"
              className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-black"
            >
              Create Your Store
            </Link>
          ) : null}
          <Link
            href={getLoginUrl()}
            className="w-full py-4 rounded-2xl bg-muted border border-border text-foreground font-bold"
          >
            Already have an account? Login
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Customer store links always use{" "}
          <span className="font-mono text-foreground break-all">
            {getStoreUrl("your-store")}
          </span>
          {" "}— not the marketing homepage.
        </p>
      </div>
    </main>
  );
}
