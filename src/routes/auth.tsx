import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Suresh General Store" },
      { name: "description", content: "Sign in to manage the Suresh General Store inventory." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">Suresh General Store</h1>
        <p className="text-sm text-muted-foreground">Inventory Management</p>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm onDone={() => setTab("signin")} />
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: emails starting with <span className="font-medium">suresh</span> get Owner
                access. Others get Staff access.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link to="/" className="underline">
          Back to store
        </Link>
      </p>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name.trim() || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Display name</Label>
        <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Suresh" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}