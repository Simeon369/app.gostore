"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Rocket, Store, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { isValidStoreSlug, slugifyStoreName } from "@/lib/store-slug";
import { setSessionItem } from "@/lib/safe-storage";
import { getAppHost } from "@/lib/urls";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SignupForm() {
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const router = useRouter();
  const supabase = createClient();

  const slug = useMemo(() => slugifyStoreName(storeName), [storeName]);
  const appHost = getAppHost();

  useEffect(() => {
    if (!storeName.trim()) {
      setSlugStatus("idle");
      return;
    }

    if (!isValidStoreSlug(slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setSlugStatus("invalid");
          return;
        }
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("invalid");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [storeName, slug]);

  const checkSlugAvailable = async (value: string): Promise<boolean> => {
    const res = await fetch(`/api/stores/check-slug?slug=${encodeURIComponent(value)}`);
    const data = await res.json();
    return res.ok && data.available === true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedStoreName = storeName.trim();
    const normalizedInviteCode = inviteCode.trim().toUpperCase();

    if (!trimmedStoreName) {
      setError("Please enter a store name.");
      setLoading(false);
      return;
    }

    if (!isValidStoreSlug(slug)) {
      setError("Choose a valid store name (letters and numbers, at least 2 characters).");
      setLoading(false);
      return;
    }

    if (!normalizedInviteCode) {
      setError("Please enter your invite code.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (slugStatus === "taken") {
      setError("That store name is already taken. Try another one.");
      setLoading(false);
      return;
    }

    try {
      const settingsRes = await fetch("/api/platform/settings");
      const settings = await settingsRes.json();
      if (!settings.signup_enabled) {
        window.location.href = "/join";
        return;
      }

      const stillAvailable = await checkSlugAvailable(slug);
      if (!stillAvailable) {
        setSlugStatus("taken");
        setError("That store name was just taken. Please choose another.");
        setLoading(false);
        return;
      }

      const signUpRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          inviteCode: normalizedInviteCode,
        }),
      });
      const signUpData = await signUpRes.json();

      if (!signUpRes.ok) {
        setError(signUpData.error || "Could not create account.");
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Account created. Please login to continue.");
        setLoading(false);
        router.push("/login");
        return;
      }

      setSessionItem(
        "gostore_signup_store",
        JSON.stringify({ storeName: trimmedStoreName, slug }),
      );

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const slugMessage = (() => {
    if (!storeName.trim()) return null;
    if (slugStatus === "checking") {
      return { tone: "muted" as const, text: "Checking availability..." };
    }
    if (slugStatus === "available") {
      return { tone: "success" as const, text: "Store name is available" };
    }
    if (slugStatus === "taken") {
      return { tone: "error" as const, text: "This store name is already taken" };
    }
    if (slugStatus === "invalid") {
      return {
        tone: "error" as const,
        text: "Use letters and numbers only (min. 2 characters)",
      };
    }
    return null;
  })();

  const canSubmit =
    !loading &&
    inviteCode.trim().length > 0 &&
    slugStatus === "available" &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-y-auto py-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Launch Your Store</h1>
          <p className="text-muted-foreground">Create your account and set up in 5 minutes</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-[32px] flex flex-col gap-6 shadow-2xl">
          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Kemi's Hair Bundles"
                    required
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
                {slug && (
                  <p className="text-xs text-muted-foreground ml-1">
                    {appHost}/store/{slug}
                  </p>
                )}
                {slugMessage && (
                  <p
                    className={`text-xs font-medium ml-1 flex items-center gap-1.5 ${
                      slugMessage.tone === "success"
                        ? "text-primary"
                        : slugMessage.tone === "error"
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {slugStatus === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {slugStatus === "available" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {(slugStatus === "taken" || slugStatus === "invalid") && (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {slugMessage.text}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@creator.com"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="GST-9XQ2-P7"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground uppercase tracking-widest focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground ml-1">
                  Signup is invite-only. Ask GoStore for a valid one-time code.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 font-medium ml-1">Passwords do not match</p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(158,226,55,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
              {loading ? "Creating account..." : "Get Started"}
            </button>
          </form>
        </div>

        <p className="text-center text-muted-foreground font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
