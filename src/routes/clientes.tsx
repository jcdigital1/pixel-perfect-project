import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPhone, whatsappURL } from "@/lib/format";
import { salesQueryOptions } from "@/lib/sales";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Pr Ivânia Gestão" },
      { name: "description", content: "Sua carteira de clientes com histórico de compras." },
      { property: "og:title", content: "Clientes — Pr Ivânia Gestão" },
      {
        property: "og:description",
        content: "Sua carteira de clientes com histórico de compras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { data: sales = [] } = useQuery(salesQueryOptions);

  const clients = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string | null; total: number; count: number; pending: number }
    >();
    for (const sale of sales) {
      const key = sale.client_name.trim().toLowerCase();
      if (!key) continue;
      const current = map.get(key) ?? {
        name: sale.client_name,
        phone: sale.client_phone,
        total: 0,
        count: 0,
        pending: 0,
      };
      current.total += sale.sale_amount;
      current.count += 1;
      if (!sale.is_paid) current.pending += sale.sale_amount;
      if (!current.phone) current.phone = sale.client_phone;
      map.set(key, current);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [sales]);

  return (
    <AppShell title="Clientes" subtitle={`${clients.length} cliente(s) na carteira`}>
      {clients.length === 0 ? (
        <p className="panel p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente ainda. Registre a primeira venda.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <div key={client.name} className="glass-3d rounded-2xl p-4">
              <h3 className="truncate font-black">{client.name}</h3>
              <p className="text-xs text-muted-foreground">{formatPhone(client.phone)}</p>
              <div className="panel mt-3 grid grid-cols-3 gap-2 p-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Compras</p>
                  <p className="text-sm font-black">{client.count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-sm font-black">{formatCurrency(client.total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Pendente</p>
                  <p className="text-sm font-black text-warning">
                    {formatCurrency(client.pending)}
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                className="mt-3 w-full"
                onClick={() =>
                  window.open(
                    whatsappURL(
                      client.phone,
                      `Olá, ${client.name.split(" ")[0]}! Tudo bem? Passando para falar sobre o seu acompanhamento. 💜`,
                    ),
                    "_blank",
                  )
                }
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
