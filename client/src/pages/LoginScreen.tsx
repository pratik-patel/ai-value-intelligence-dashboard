import { useState } from "react";
import { Activity, LockKeyhole, ShieldCheck, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginScreenProps = {
  onLogin: (username: string, password: string) => boolean;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isValid = onLogin(username.trim(), password);
    if (!isValid) {
      setError("Invalid username or password.");
      return;
    }
    setError("");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,#0a0f18,#05080f)] text-slate-200 flex items-center justify-center px-6">
      <div className="w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure access
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_24px_rgba(59,130,246,0.25)]">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">AI Value Intelligence</span>
            </div>
            <h1 className="dashboard-page-title max-w-xl">Access the executive AI governance workspace.</h1>
            <p className="dashboard-page-lead max-w-2xl">
              Review posture, ownership, policy controls, evidence, and strategic recommendations from the latest AI telemetry snapshot.
            </p>
          </div>
        </div>

        <Card className="bg-[#111827] border-white/6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <CardTitle className="dashboard-card-title text-slate-100">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="dashboard-eyebrow">Username</label>
                <div className="relative">
                  <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin"
                    className="pl-9 bg-[#0B1120] border-white/10 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="dashboard-eyebrow">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    className="pl-9 bg-[#0B1120] border-white/10 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.18)]"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
