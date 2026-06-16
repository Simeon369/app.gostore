"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Copy, Ban } from "lucide-react";
import { toast } from "sonner";

type InviteCode = {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  used_at: string | null;
};

export function InviteCodesManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-codes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load codes");
      setCodes(data.codes || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCodes();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate codes");
      const newCodes: InviteCode[] = data.codes || [];
      setCodes((prev) => [...newCodes, ...prev].slice(0, 50));
      toast.success(`Generated ${newCodes.length} invite code${newCodes.length > 1 ? "s" : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate codes");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke code");
      setCodes((prev) => prev.map((code) => (code.id === id ? data : code)));
      toast.success("Invite code revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke code");
    } finally {
      setRevokingId(null);
    }
  };

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground font-semibold">Generate</label>
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            className="w-20 mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm font-semibold"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Codes
        </button>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
          <div className="col-span-4">Code</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading invite codes...
          </div>
        ) : codes.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No invite codes yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {codes.map((code) => {
              const status = code.used_at
                ? "Used"
                : code.is_active
                  ? "Active"
                  : "Revoked";
              return (
                <div key={code.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm">
                  <div className="col-span-4 font-mono font-semibold">{code.code}</div>
                  <div className="col-span-3">{status}</div>
                  <div className="col-span-3 text-xs text-muted-foreground">
                    {new Date(code.created_at).toLocaleString("en-NG")}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => copyCode(code.code)}
                      className="p-2 rounded-lg border border-border hover:bg-muted"
                      title="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(code.id)}
                      disabled={!code.is_active || !!code.used_at || revokingId === code.id}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                      title="Revoke code"
                    >
                      {revokingId === code.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
