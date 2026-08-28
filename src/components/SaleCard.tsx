import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPhone, todayString } from "@/lib/format";
import { openWhatsApp, type Preferences, type Sale } from "@/lib/sales";
import { useSaleDialog } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export function useSaleActions() {
  const queryClient = useQueryClient();

  const togglePaid = useMutation({
    mutationFn: async (sale: Sale) => {
      const { error } = await supabase
        .from("sales")
        .update({
          is_paid: !sale.is_paid,
          paid_at: !sale.is_paid ? todayString() : null,
        })
        .eq("id", sale.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (sale: Sale) => {
      const { error } = await supabase.from("sales").delete().eq("id", sale.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { togglePaid, remove };
}

export function SaleCard({ sale, preferences }: { sale: Sale; preferences: Preferences }) {
  const { openSale } = useSaleDialog();
  const { togglePaid, remove } = useSaleActions();
  const profit = sale.sale_amount - sale.cost_amount;

  return (
    <div className="glass-3d rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-black">{sale.client_name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {formatPhone(sale.client_phone)}
            {sale.product_description ? ` • ${sale.product_description}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black",
            sale.is_paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
          )}
        >
          {sale.is_paid ? "RECEBIDO" : "PENDENTE"}
        </span>
      </div>

      <div className="panel mt-3 grid grid-cols-3 gap-2 p-3 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">Venda</p>
          <p className="text-sm font-black">{formatCurrency(sale.sale_amount)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Lucro</p>
          <p className="text-sm font-black text-success">{formatCurrency(profit)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">
            {sale.is_paid ? "Pago em" : "Cobrança"}
          </p>
          <p className="text-sm font-black">
            {formatDate(sale.is_paid ? (sale.paid_at ?? sale.sale_date) : sale.due_date)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() =>
            openWhatsApp(
              sale,
              sale.is_paid ? preferences.receipt_template : preferences.billing_template,
              sale.is_paid ? "receipt" : "billing",
            )
          }
        >
          <Send className="h-4 w-4" />
          {sale.is_paid ? "Enviar recibo" : "Cobrar"}
        </Button>
        <Button variant="hero" size="sm" onClick={() => togglePaid.mutate(sale)}>
          {sale.is_paid ? "Marcar pendente" : "Marcar recebido"}
        </Button>
      </div>

      <div className="mt-2 flex gap-2">
        <Button variant="muted" size="sm" className="flex-1" onClick={() => openSale(sale)}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
        <Button
          variant="softDestructive"
          size="sm"
          onClick={() => {
            if (confirm(`Excluir a venda de ${sale.client_name}?`)) remove.mutate(sale);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
