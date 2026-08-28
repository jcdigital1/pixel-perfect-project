import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSaleActions } from "@/components/SaleCard";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPhone, monthPrefix, todayString } from "@/lib/format";
import { openWhatsApp, preferencesQueryOptions, salesQueryOptions } from "@/lib/sales";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recebiveis")({
  head: () => ({
    meta: [
      { title: "Contas a Receber — Pr Ivânia Gestão" },
      { name: "description", content: "Acompanhe pagamentos pendentes, atrasos e cobranças." },
      { property: "og:title", content: "Contas a Receber — Pr Ivânia Gestão" },
      {
        property: "og:description",
        content: "Acompanhe pagamentos pendentes, atrasos e cobranças.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceivablesPage,
});

function ReceivablesPage() {
  const { data: sales = [] } = useQuery(salesQueryOptions);
  const { data: preferences } = useQuery(preferencesQueryOptions);
  const { togglePaid } = useSaleActions();
  const today = todayString();

  const pending = sales
    .filter((s) => !s.is_paid)
    .sort((a, b) => (a.due_date ?? "9999-99-99").localeCompare(b.due_date ?? "9999-99-99"));
  const pendingTotal = pending.reduce((sum, s) => sum + s.sale_amount, 0);
  const overdueTotal = pending
    .filter((s) => s.due_date && s.due_date < today)
    .reduce((sum, s) => sum + s.sale_amount, 0);
  const monthPaid = sales
    .filter((s) => s.is_paid && (s.paid_at ?? s.sale_date).startsWith(monthPrefix()))
    .reduce((sum, s) => sum + s.sale_amount, 0);

  return (
    <AppShell title="Contas a Receber" subtitle="Quem ainda precisa pagar">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pendente" value={formatCurrency(pendingTotal)} hint={`${pending.length} cobrança(s)`} />
        <StatCard label="Em atraso" value={formatCurrency(overdueTotal)} hint="Vencidas" tone="danger" />
        <StatCard label="Recebido no mês" value={formatCurrency(monthPaid)} hint="Mês atual" tone="success" />
      </div>

      {pending.length === 0 ? (
        <div className="panel py-12 text-center">
          <div className="icon-green mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="font-bold text-success">Nenhum pagamento pendente! 💜</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((sale) => {
            const overdue = !!sale.due_date && sale.due_date < today;
            return (
              <div
                key={sale.id}
                className="panel lift-3d flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h4 className="truncate font-bold">{sale.client_name}</h4>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatPhone(sale.client_phone)}
                    {sale.product_description ? ` • ${sale.product_description}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Cobrança</p>
                    <p
                      className={cn(
                        "text-xs font-black",
                        overdue ? "text-destructive" : "text-warning",
                      )}
                    >
                      {formatDate(sale.due_date)}
                    </p>
                  </div>
                  <p className="font-black">{formatCurrency(sale.sale_amount)}</p>
                  <Button
                    variant="success"
                    size="icon"
                    title="Cobrar no WhatsApp"
                    onClick={() =>
                      preferences && openWhatsApp(sale, preferences.billing_template, "billing")
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="hero"
                    size="icon"
                    title="Marcar recebido"
                    onClick={() => togglePaid.mutate(sale)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <div className="glass-3d lift-3d rounded-2xl p-4">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-black",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
