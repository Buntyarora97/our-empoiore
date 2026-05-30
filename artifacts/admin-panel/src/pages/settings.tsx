import { useState, useEffect } from "react";
import {
  useAdminGetSettings,
  useAdminUpdateSettings,
  getAdminGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data, isLoading } = useAdminGetSettings({ query: { queryKey: getAdminGetSettingsQueryKey() } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    appName: "", whatsappNumber: "", telegramLink: "",
    maintenanceMode: false, minDeposit: "", minWithdrawal: "",
    referralCommission: "", upiIds: [] as string[],
  });
  const [newUpi, setNewUpi] = useState("");

  useEffect(() => {
    if (data) setForm({
      appName: data.appName ?? "", whatsappNumber: data.whatsappNumber ?? "",
      telegramLink: data.telegramLink ?? "", maintenanceMode: data.maintenanceMode ?? false,
      minDeposit: data.minDeposit ?? "", minWithdrawal: data.minWithdrawal ?? "",
      referralCommission: data.referralCommission ?? "", upiIds: (data.upiIds ?? []) as string[],
    });
  }, [data]);

  const update = useAdminUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
        toast({ title: "Settings saved" });
      },
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      <div className="bg-card border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-medium text-foreground border-b border-border pb-2">App Configuration</h2>
        <Field label="App Name"><input data-testid="input-app-name" value={form.appName} onChange={set("appName")} className="input-style" /></Field>
        <Field label="WhatsApp Number"><input data-testid="input-whatsapp" value={form.whatsappNumber} onChange={set("whatsappNumber")} className="input-style" /></Field>
        <Field label="Telegram Link"><input data-testid="input-telegram" value={form.telegramLink} onChange={set("telegramLink")} className="input-style" /></Field>
        <Field label="Maintenance Mode">
          <label className="flex items-center gap-2 cursor-pointer">
            <input data-testid="input-maintenance" type="checkbox" checked={form.maintenanceMode} onChange={set("maintenanceMode")} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-muted-foreground">{form.maintenanceMode ? "On — App is in maintenance mode" : "Off"}</span>
          </label>
        </Field>
      </div>

      <div className="bg-card border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-medium text-foreground border-b border-border pb-2">Financial Limits</h2>
        <Field label="Min Deposit (₹)"><input data-testid="input-min-deposit" type="number" value={form.minDeposit} onChange={set("minDeposit")} className="input-style" /></Field>
        <Field label="Min Withdrawal (₹)"><input data-testid="input-min-withdrawal" type="number" value={form.minWithdrawal} onChange={set("minWithdrawal")} className="input-style" /></Field>
        <Field label="Referral Commission (%)"><input data-testid="input-referral-commission" type="number" value={form.referralCommission} onChange={set("referralCommission")} className="input-style" /></Field>
      </div>

      <div className="bg-card border border-border rounded p-5 space-y-3">
        <h2 className="text-sm font-medium text-foreground border-b border-border pb-2">UPI IDs</h2>
        {form.upiIds.map((id, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-foreground font-mono bg-background border border-border rounded px-3 py-2">{id}</span>
            <button onClick={() => setForm(f => ({ ...f, upiIds: f.upiIds.filter((_, j) => j !== i) }))} className="p-1.5 border border-red-800 rounded hover:bg-red-900/20 text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input data-testid="input-new-upi" value={newUpi} onChange={(e) => setNewUpi(e.target.value)} placeholder="Add UPI ID..." className="flex-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
          <button data-testid="button-add-upi" onClick={() => { if (newUpi) { setForm(f => ({ ...f, upiIds: [...f.upiIds, newUpi] })); setNewUpi(""); } }} className="px-3 py-2 border border-border rounded hover:bg-muted text-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
      </div>

      <button
        data-testid="button-save-settings"
        onClick={() => update.mutate({ data: form })}
        disabled={update.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Save className="w-4 h-4" />{update.isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
