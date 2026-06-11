import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { getMarketingWaitlistUrl, getPlatformSettings } from "@/lib/platform-settings";

// Must read live DB flag — never bake redirect in at build time
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const settings = await getPlatformSettings();

  if (!settings.signup_enabled) {
    redirect(getMarketingWaitlistUrl());
  }

  return <SignupForm />;
}
