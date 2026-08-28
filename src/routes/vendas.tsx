import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SaleCard } from "@/components/SaleCard";
import { Input } from "@/components/ui/input";
import { preferencesQueryOptions, salesQueryOptions } from "@/lib/sales";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — Pr Ivânia Gestão" },
      { name: "description", content: "Todas as suas vendas registradas, com lucro e status." },
      { property: "og:title", content: "Vendas — Pr Ivânia Gestão" },
      {
        property: "og:description",
        content: "Todas as suas vendas registradas, com lucro e status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const [search, setSearch] = useState("");
  const { data: sales = [] } = useQuery(salesQueryOptions);
  const { data: preferences } = useQuery(preferencesQueryOptions);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter(
      (s) =>
        s.client_name.toLowerCase().includes(term) ||
        (s.product_description ?? "").toLowerCase().includes(term),
    );
  }, [sales, search]);

  return (
    <AppShell title="Vendas" subtitle={`${sales.length} venda(s) registradas`}>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou produto..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="panel p-8 text-center text-sm text-muted-foreground">
          Nenhuma venda encontrada.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {preferences &&
            filtered.map((sale) => (
              <SaleCard key={sale.id} sale={sale} preferences={preferences} />
            ))}
        </div>
      )}
    </AppShell>
  );
}
