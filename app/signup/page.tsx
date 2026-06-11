import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { getMarketingWaitlistUrl, getPlatformSettings } from "@/lib/platform-settings";

export default async function SignupPage() {
  const settings = await getPlatformSettings();

  if (!settings.signup_enabled) {
    redirect(getMarketingWaitlistUrl());
  }

  return <SignupForm />;
}
