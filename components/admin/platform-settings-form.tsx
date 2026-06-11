"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { PlatformSettings } from "@/lib/platform-settings";

type PlatformSettingsFormProps = {
  initialSettings: PlatformSettings;
};

function Toggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full border relative transition-colors shrink-0 ${
        enabled ? "bg-primary border-primary" : "bg-muted border-border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export function PlatformSettingsForm({ initialSettings }: PlatformSettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState<"signup_enabled" | "maintenance_mode" | null>(null);

  const updateSetting = async (
    key: "signup_enabled" | "maintenance_mode",
    value: boolean,
  ) => {
    const previous = settings;
    setSettings((current) => ({ ...current, [key]: value }));
    setSaving(key);

    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save setting");
      }

      setSettings(data);
      toast.success(key === "signup_enabled" ? "Signup access updated" : "Maintenance mode updated");
    } catch (error) {
      setSettings(previous);
      toast.error(error instanceof Error ? error.message : "Failed to save setting");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between py-4 border-b border-border gap-6">
        <div>
          <p className="font-semibold text-sm text-foreground">Allow New Signups</p>
          <p className="text-xs text-muted-foreground mt-1">
            When off, <span className="font-mono">/signup</span> sends users to the marketing waitlist.
            When on, vendors can create accounts and start onboarding.
          </p>
        </div>
        <Toggle
          enabled={settings.signup_enabled}
          disabled={saving === "signup_enabled"}
          onChange={(value) => updateSetting("signup_enabled", value)}
        />
      </div>

      <div className="flex items-center justify-between py-4 gap-6">
        <div>
          <p className="font-semibold text-sm text-foreground">Maintenance Mode</p>
          <p className="text-xs text-muted-foreground mt-1">
            Stored for future use. Storefronts and dashboards are not blocked yet.
          </p>
        </div>
        <Toggle
          enabled={settings.maintenance_mode}
          disabled={saving === "maintenance_mode"}
          onChange={(value) => updateSetting("maintenance_mode", value)}
        />
      </div>

      {settings.updated_at && (
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Last updated {new Date(settings.updated_at).toLocaleString("en-NG")}
        </p>
      )}
    </div>
  );
}
