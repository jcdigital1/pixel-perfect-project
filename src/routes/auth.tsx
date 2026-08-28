import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Pr Ivânia Gestão" },
      {
        name: "description",
        content: "Acesse seu painel de vendas, recebimentos e clientes com segurança.",
      },
      { property: "og:title", content: "Entrar — Pr Ivânia Gestão" },
      {
        property: "og:description",
        content: "Acesse seu painel de vendas, recebimentos e clientes com segurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "User already registered": "Este e-mail já possui uma conta. Clique em ENTRAR.",
};

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMode("login");
          toast.success("Conta criada! Confirme o e-mail que enviamos e depois faça login.");
          return;
        }
        toast.success("Conta criada com sucesso!");
      }
      navigate({ to: "/" });

    } catch (err) {
      const message = (err as Error).message;
      setError(ERRORS[message] ?? message);
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="glass-3d w-full max-w-md rounded-3xl p-7">
        <div className="mb-7 text-center">
          <div className="icon-purple mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Pr Ivânia Gestão</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle de vendas, recebimentos e clientes.
          </p>
        </div>

        <div className="panel mb-5 grid grid-cols-2 gap-1 p-1">
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError("");
              }}
              className={cn(
                "rounded-xl py-2 text-xs font-black transition-colors",
                mode === value ? "icon-purple text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {value === "login" ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Mostrar senha"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy ? "Aguarde..." : mode === "login" ? "ACESSAR PR IVÂNIA GESTÃO" : "CRIAR CONTA E ENTRAR"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="muted" size="lg" className="w-full" onClick={googleSignIn}>
          Continuar com Google
        </Button>
      </div>
    </div>
  );
}
