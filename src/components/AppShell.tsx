import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Clock3,
  LogOut,
  Plus,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { salesQueryOptions, type Sale } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import { SaleDialog } from "@/components/SaleDialog";
import { cn } from "@/lib/utils";

type SaleDialogContext = { openSale: (sale?: Sale | null) => void };
const SaleDialogCtx = createContext<SaleDialogContext>({ openSale: () => {} });
export const useSaleDialog = () => useContext(SaleDialogCtx);

const NAV = [
  { to: "/", label: "Painel", icon: BarChart3 },
  { to: "/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/recebiveis", label: "A Receber", icon: Clock3 },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/config", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const { data: sales } = useQuery({ ...salesQueryOptions, enabled: !!user });

  const counts = useMemo(() => {
    const list = sales ?? [];
    const clients = new Set(list.map((s) => s.client_name.trim().toLowerCase()).filter(Boolean));
    return {
      sales: list.length,
      pending: list.filter((s) => !s.is_paid).length,
      clients: clients.size,
    };
  }, [sales]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);


  const ctx = useMemo<SaleDialogContext>(
    () => ({
      openSale: (sale) => {
        setEditing(sale ?? null);
        setDialogOpen(true);
      },
    }),
    [],
  );

  const badgeFor = (to: string) =>
    to === "/vendas"
      ? counts.sales
      : to === "/recebiveis"
        ? counts.pending
        : to === "/clientes"
          ? counts.clients
          : null;

  return (
    <SaleDialogCtx.Provider value={ctx}>
      <div className="aurora-bg min-h-screen bg-background">
        <div className="mx-auto flex max-w-7xl">
          <aside className="glass-3d sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between p-5 lg:flex">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="icon-purple flex h-11 w-11 items-center justify-center rounded-2xl">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="emboss text-sm font-black leading-tight">Pr Ivânia Gestão</p>
                  <p className="text-[11px] text-muted-foreground">Vendas & recebimentos</p>
                </div>
              </div>
              <nav className="space-y-1.5">
                {NAV.map(({ to, label, icon: Icon }) => {
                  const active = pathname === to;
                  const badge = badgeFor(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 hover:translate-x-0.5",
                        active
                          ? "icon-purple emboss text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >

                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{label}</span>
                      {badge ? (
                        <span className="rounded-full bg-background/40 px-2 py-0.5 text-[10px] font-black">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="panel space-y-3 p-3">
              <p className="truncate text-[11px] text-muted-foreground">{user?.email ?? "Conta"}</p>
              <Button
                variant="muted"
                size="sm"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </aside>

          <main className="stage-3d min-w-0 flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-gradient-purple text-2xl font-black tracking-tight lg:text-3xl">
                  {title}
                </h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              <Button variant="hero" onClick={() => ctx.openSale(null)} className="shrink-0">
                <Plus className="h-4 w-4" /> Nova venda
              </Button>
            </header>

            {children}
          </main>
        </div>

        <nav className="glass-3d fixed bottom-0 left-0 right-0 z-40 flex justify-around px-2 py-2 lg:hidden">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold",
                  active ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    active ? "icon-purple" : "",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <SaleDialog open={dialogOpen} onOpenChange={setDialogOpen} sale={editing} />
      </div>
    </SaleDialogCtx.Provider>
  );
}
