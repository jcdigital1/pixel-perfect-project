import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_METHODS, type Sale } from "@/lib/sales";
import { formatCurrency, todayString } from "@/lib/format";
import { cn } from "@/lib/utils";

type FormState = {
  client_name: string;
  client_phone: string;
  product_description: string;
  sale_amount: string;
  cost_amount: string;
  sale_date: string;
  payment_method: string;
  is_paid: boolean;
  due_date: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    client_name: "",
    client_phone: "",
    product_description: "",
    sale_amount: "",
    cost_amount: "",
    sale_date: todayString(),
    payment_method: "PIX",
    is_paid: true,
    due_date: "",
    notes: "",
  };
}

export function SaleDialog({
  open,
  onOpenChange,
  sale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setForm(
      sale
        ? {
            client_name: sale.client_name,
            client_phone: sale.client_phone ?? "",
            product_description: sale.product_description ?? "",
            sale_amount: String(sale.sale_amount ?? ""),
            cost_amount: String(sale.cost_amount ?? ""),
            sale_date: sale.sale_date,
            payment_method: sale.payment_method,
            is_paid: sale.is_paid,
            due_date: sale.due_date ?? "",
            notes: sale.notes ?? "",
          }
        : emptyForm(),
    );
  }, [open, sale]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const profit = Number(form.sale_amount || 0) - Number(form.cost_amount || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        product_description: form.product_description.trim() || null,
        sale_amount: Number(form.sale_amount || 0),
        cost_amount: Number(form.cost_amount || 0),
        sale_date: form.sale_date || todayString(),
        payment_method: form.payment_method,
        is_paid: form.is_paid,
        paid_at: form.is_paid ? (sale?.paid_at ?? todayString()) : null,
        due_date: form.is_paid ? null : form.due_date || null,
        notes: form.notes.trim() || null,
      };
      if (sale) {
        const { error } = await supabase.from("sales").update(payload).eq("id", sale.id);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("sales")
          .insert({ ...payload, user_id: userData.user?.id as string });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success(sale ? "Venda atualizada!" : "Venda registrada!");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-3d max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">
            {sale ? "Editar Venda" : "Nova Venda"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.client_name.trim()) {
              toast.error("Informe o nome do cliente.");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome do cliente</Label>
              <Input
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                placeholder="Maria Silva"
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
                placeholder="(11) 98888-7777"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Produto / serviço</Label>
            <Input
              value={form.product_description}
              onChange={(e) => set("product_description", e.target.value)}
              placeholder="Consulta, curso, produto..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Valor da venda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.sale_amount}
                onChange={(e) => set("sale_amount", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.cost_amount}
                onChange={(e) => set("cost_amount", e.target.value)}
              />
            </div>
          </div>

          <div className="panel flex items-center justify-between px-4 py-3">
            <span className="text-xs font-bold text-muted-foreground">Lucro estimado</span>
            <span
              className={cn(
                "text-base font-black",
                profit >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {formatCurrency(profit)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Data da venda</Label>
              <Input
                type="date"
                value={form.sale_date}
                onChange={(e) => set("sale_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <select
                className="h-10 w-full rounded-xl border border-input bg-inner px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.payment_method}
                onChange={(e) => set("payment_method", e.target.value)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black">Já recebeu o pagamento?</h4>
                <p className="text-[11px] text-muted-foreground">
                  {form.is_paid ? "Valor recebido." : "Vai entrar em contas a receber."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.is_paid ? "success" : "muted"}
                  onClick={() => set("is_paid", true)}
                >
                  SIM
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.is_paid ? "muted" : "destructive"}
                  onClick={() => set("is_paid", false)}
                >
                  NÃO
                </Button>
              </div>
            </div>

            {!form.is_paid && (
              <div className="space-y-1.5">
                <Label>Data de cobrança</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => set("due_date", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Detalhes do combinado..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="muted"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
