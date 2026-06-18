import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { getPlatformSettings } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const settings = await getPlatformSettings();

  if (!settings.signup_enabled) {
    redirect("/join");
  }

  return <SignupForm />;
}
