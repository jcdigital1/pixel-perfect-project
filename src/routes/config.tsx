import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_BILLING_TEMPLATE,
  DEFAULT_RECEIPT_TEMPLATE,
  preferencesQueryOptions,
} from "@/lib/sales";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "Ajustes — Gestão 3D" },
      { name: "description", content: "Personalize as mensagens de cobrança e recibo." },
      { property: "og:title", content: "Ajustes — Gestão 3D" },
      { property: "og:description", content: "Personalize as mensagens de cobrança e recibo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: preferences } = useQuery(preferencesQueryOptions);
  const [billing, setBilling] = useState(DEFAULT_BILLING_TEMPLATE);
  const [receipt, setReceipt] = useState(DEFAULT_RECEIPT_TEMPLATE);

  useEffect(() => {
    if (preferences) {
      setBilling(preferences.billing_template);
      setReceipt(preferences.receipt_template);
    }
  }, [preferences]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: userData.user?.id as string,
        billing_template: billing,
        receipt_template: receipt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Modelos salvos!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Ajustes" subtitle="Conta e mensagens automáticas">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass-3d space-y-3 rounded-2xl p-5">
          <h2 className="font-black">Minha conta</h2>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? "Conta"}</p>
          <Button
            variant="softDestructive"
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </div>

        <div className="glass-3d space-y-4 rounded-2xl p-5">
          <div>
            <h2 className="font-black">Mensagens do WhatsApp</h2>
            <p className="text-xs text-muted-foreground">
              Use as variáveis {"{nome}"}, {"{valor}"}, {"{produto}"} e {"{data}"}.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Mensagem de cobrança</Label>
            <Textarea rows={4} value={billing} onChange={(e) => setBilling(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Mensagem de recibo</Label>
            <Textarea rows={4} value={receipt} onChange={(e) => setReceipt(e.target.value)} />
          </div>

          <Button variant="hero" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar modelos"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
