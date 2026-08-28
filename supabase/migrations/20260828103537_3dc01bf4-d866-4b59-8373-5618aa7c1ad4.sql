CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_name text NOT NULL,
  client_phone text,
  product_description text,
  sale_amount numeric NOT NULL DEFAULT 0,
  cost_amount numeric NOT NULL DEFAULT 0,
  sale_date date NOT NULL DEFAULT current_date,
  payment_method text NOT NULL DEFAULT 'PIX',
  is_paid boolean NOT NULL DEFAULT true,
  paid_at date,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  billing_template text NOT NULL DEFAULT 'Olá, {nome}! Tudo bem? Passando para lembrar do seu pagamento referente a {produto}, no valor de {valor}, com vencimento previsto para {data}. Qualquer dúvida, estou à disposição! 💜',
  receipt_template text NOT NULL DEFAULT 'Olá, {nome}! Confirmamos o recebimento do seu pagamento no valor de {valor} referente a {produto}. Muito obrigado pela confiança! 💜',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX sales_user_date_idx ON public.sales (user_id, sale_date DESC);