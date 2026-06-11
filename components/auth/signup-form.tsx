"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const settingsRes = await fetch("/api/platform/settings");
      const settings = await settingsRes.json();
      if (!settings.signup_enabled) {
        const marketingBase =
          process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, "") ||
          "https://home-gostore.vercel.app";
        window.location.href = `${marketingBase}/join`;
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-y-auto py-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
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
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
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
