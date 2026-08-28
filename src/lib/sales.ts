import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, whatsappURL } from "./format";

export type Sale = {
  id: string;
  user_id: string;
  client_name: string;
  client_phone: string | null;
  product_description: string | null;
  sale_amount: number;
  cost_amount: number;
  sale_date: string;
  payment_method: string;
  is_paid: boolean;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

export type SaleInput = Omit<Sale, "id" | "user_id" | "created_at">;

export const DEFAULT_BILLING_TEMPLATE =
  "Olá, {nome}! Tudo bem? Passando para lembrar do seu pagamento referente a {produto}, no valor de {valor}, com vencimento previsto para {data}. Qualquer dúvida, estou à disposição! 💜";

export const DEFAULT_RECEIPT_TEMPLATE =
  "Olá, {nome}! Confirmamos o recebimento do seu pagamento no valor de {valor} referente a {produto}. Muito obrigado pela confiança! 💜";

export const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Cartão",
  "A Prazo / Pagar Depois",
  "Parcelado",
] as const;

export const salesQueryOptions = queryOptions({
  queryKey: ["sales"],
  queryFn: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      sale_amount: Number(row.sale_amount),
      cost_amount: Number(row.cost_amount),
    })) as Sale[];
  },
});

export type Preferences = {
  billing_template: string;
  receipt_template: string;
};

export const preferencesQueryOptions = queryOptions({
  queryKey: ["preferences"],
  queryFn: async (): Promise<Preferences> => {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("billing_template, receipt_template")
      .maybeSingle();
    if (error) throw error;
    return (
      data ?? {
        billing_template: DEFAULT_BILLING_TEMPLATE,
        receipt_template: DEFAULT_RECEIPT_TEMPLATE,
      }
    );
  },
});

export function buildMessage(template: string, sale: Sale, dateValue: string | null) {
  return template
    .replace(/{nome}/gi, (sale.client_name ?? "").split(" ")[0] ?? "")
    .replace(/{valor}/gi, formatCurrency(sale.sale_amount))
    .replace(/{produto}/gi, sale.product_description ?? "")
    .replace(/{data}/gi, formatDate(dateValue));
}

export function openWhatsApp(sale: Sale, template: string, kind: "billing" | "receipt") {
  const dateValue = kind === "billing" ? sale.due_date : (sale.paid_at ?? sale.sale_date);
  const message = buildMessage(template, sale, dateValue);
  window.open(whatsappURL(sale.client_phone, message), "_blank");
}
