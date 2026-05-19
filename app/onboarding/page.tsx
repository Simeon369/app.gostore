import { OnboardingWizard } from "../../components/onboarding/wizard";
import Image from "next/image";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-y-auto py-12">
      {/* Background Blobs for aesthetics */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-xl flex flex-col gap-8 z-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/gostore-logo.png"
            alt="GoStore Logo"
            width={48}
            height={48}
            className="w-12 h-12 mb-2"
          />
          <h1 className="text-3xl font-black tracking-tight">Let's setup your store</h1>
          <p className="text-muted-foreground">It only takes 60 seconds to get ready for payments.</p>
        </div>

        <OnboardingWizard />
      </div>
    </main>
  );
}
