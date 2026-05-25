import { Settings, ShieldCheck, Zap } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Global configuration for the GoStore platform.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Section 1 */}
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
          
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <p className="font-semibold text-sm text-foreground">Allow New Signups</p>
              <p className="text-xs text-muted-foreground mt-1">When disabled, new users cannot register for stores.</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-muted border border-border relative opacity-50 cursor-not-allowed">
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold text-sm text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground mt-1">Show a maintenance page to all visitors.</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-muted border border-border relative opacity-50 cursor-not-allowed">
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-muted-foreground" />
            </div>
          </div>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-4">Coming Soon</p>
        </div>

        {/* Section 2 */}
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
                value="10" 
                className="w-full max-w-xs bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground opacity-50 cursor-not-allowed" 
              />
              <p className="text-xs text-muted-foreground mt-2">Currently hardcoded to 10% in the Paystack split configuration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
