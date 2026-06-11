import { ShieldCheck, Zap } from "lucide-react";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Global configuration for the GoStore platform.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Access Control</h2>
              <p className="text-xs text-muted-foreground">Manage who can join the platform.</p>
            </div>
          </div>

          <PlatformSettingsForm initialSettings={settings} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Revenue Settings</h2>
              <p className="text-xs text-muted-foreground">Configure platform fee structures.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Platform Commission (%)</label>
              <input
                type="number"
                disabled
                value="5"
                className="w-full max-w-xs bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                5% commission capped at ₦10,000 per sale (manual transfer checkout).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
