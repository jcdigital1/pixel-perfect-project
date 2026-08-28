import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Send, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SaleCard } from "@/components/SaleCard";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPhone, getWeekRange, monthPrefix, todayString } from "@/lib/format";
import { openWhatsApp, preferencesQueryOptions, salesQueryOptions } from "@/lib/sales";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Vendas — Gestão 3D" },
      {
        name: "description",
        content:
          "Painel com lucro da semana, faturamento do mês, contas a receber e cobranças no WhatsApp.",
      },
      { property: "og:title", content: "Painel de Vendas — Gestão 3D" },
      {
        property: "og:description",
        content:
          "Painel com lucro da semana, faturamento do mês, contas a receber e cobranças no WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: sales = [] } = useQuery(salesQueryOptions);
  const { data: preferences } = useQuery(preferencesQueryOptions);
  const today = todayString();
  const week = getWeekRange();
  const month = monthPrefix();

  const weekSales = sales.filter((s) => s.sale_date >= week.start && s.sale_date <= week.end);
  const weekProfit = weekSales.reduce((sum, s) => sum + (s.sale_amount - s.cost_amount), 0);
  const monthSales = sales.filter((s) => s.sale_date.startsWith(month));
  const monthProfit = monthSales.reduce((sum, s) => sum + (s.sale_amount - s.cost_amount), 0);
  const monthReceived = monthSales
    .filter((s) => s.is_paid)
    .reduce((sum, s) => sum + s.sale_amount, 0);
  const pending = sales.filter((s) => !s.is_paid);
  const pendingTotal = pending.reduce((sum, s) => sum + s.sale_amount, 0);
  const totalGenerated = sales.reduce((sum, s) => sum + s.sale_amount, 0);
  const totalPaid = sales.filter((s) => s.is_paid).reduce((sum, s) => sum + s.sale_amount, 0);
  const todayDues = pending.filter((s) => s.due_date && s.due_date <= today);
  const recent = sales.slice(0, 3);

  return (
    <AppShell title="Painel" subtitle="Visão geral do seu negócio">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<TrendingUp className="h-5 w-5 text-primary-foreground" />}
          label="Lucro da semana"
          value={formatCurrency(weekProfit)}
          hint={`${weekSales.length} venda(s)`}
        />
        <Stat
          icon={<Sparkles className="h-5 w-5 text-primary-foreground" />}
          label="Lucro do mês"
          value={formatCurrency(monthProfit)}
          hint={`Recebido: ${formatCurrency(monthReceived)}`}
        />
        <Stat
          green
          icon={<CalendarClock className="h-5 w-5 text-primary-foreground" />}
          label="A receber"
          value={formatCurrency(pendingTotal)}
          hint={`${pending.length} cobrança(s)`}
        />
        <Stat
          green
          icon={<Wallet className="h-5 w-5 text-primary-foreground" />}
          label="Total gerado"
          value={formatCurrency(totalGenerated)}
          hint={`Pago: ${formatCurrency(totalPaid)}`}
        />
      </div>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="glass-3d rounded-2xl p-5">
          <h2 className="mb-3 font-black">Cobranças de hoje</h2>
          {todayDues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada para cobrar hoje. 💜</p>
          ) : (
            <div className="space-y-2">
              {todayDues.map((sale) => (
                <div
                  key={sale.id}
                  className="panel flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{sale.client_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatPhone(sale.client_phone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">{formatCurrency(sale.sale_amount)}</span>
                    <Button
                      variant="success"
                      size="icon"
                      onClick={() =>
                        preferences && openWhatsApp(sale, preferences.billing_template, "billing")
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-3d rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">Vendas recentes</h2>
            <Link to="/vendas" className="text-xs font-bold text-primary">
              Ver todas
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {preferences &&
                recent.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} preferences={preferences} />
                ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  green,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  green?: boolean;
}) {
  return (
    <div className="glass-3d rounded-2xl p-4">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${green ? "icon-green" : "icon-purple"}`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-black">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
