import { useState } from "react";
import {
  useAdminGetMarkets,
  useAdminCreateMarket,
  useAdminUpdateMarket,
  useAdminDeleteMarket,
  getAdminGetMarketsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Market = { id: number; name: string; openTime: string; closeTime: string; status: string; minBet: string; maxBet: string; isBettingOpen: boolean };

function MarketForm({ initial, onSave, onCancel }: {
  initial?: Partial<Market>;
  onSave: (data: Omit<Market, "id" | "isBettingOpen">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    openTime: initial?.openTime ?? "",
    closeTime: initial?.closeTime ?? "",
    minBet: initial?.minBet ?? "10",
    maxBet: initial?.maxBet ?? "10000",
    status: initial?.status ?? "active",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="bg-card border border-border rounded p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Market Name</label>
          <input data-testid="input-market-name" value={form.name} onChange={set("name")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <select value={form.status} onChange={set("status")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Open Time</label>
          <input data-testid="input-market-open" type="time" value={form.openTime} onChange={set("openTime")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Close Time</label>
          <input data-testid="input-market-close" type="time" value={form.closeTime} onChange={set("closeTime")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Min Bet (₹)</label>
          <input type="number" value={form.minBet} onChange={set("minBet")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Max Bet (₹)</label>
          <input type="number" value={form.maxBet} onChange={set("maxBet")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted transition-colors flex items-center gap-1"><X className="w-3.5 h-3.5" />Cancel</button>
        <button data-testid="button-save-market" onClick={() => onSave(form)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity flex items-center gap-1"><Check className="w-3.5 h-3.5" />Save</button>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const { data: markets = [], isLoading } = useAdminGetMarkets({ query: { queryKey: getAdminGetMarketsQueryKey() } });
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: getAdminGetMarketsQueryKey() });

  const create = useAdminCreateMarket({ mutation: { onSuccess: () => { inv(); setShowAdd(false); toast({ title: "Market created" }); } } });
  const update = useAdminUpdateMarket({ mutation: { onSuccess: () => { inv(); setEditId(null); toast({ title: "Market updated" }); } } });
  const del = useAdminDeleteMarket({ mutation: { onSuccess: () => { inv(); toast({ title: "Market deleted" }); } } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Markets</h1>
        <button data-testid="button-add-market" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />Add Market
        </button>
      </div>

      {showAdd && (
        <MarketForm
          onSave={(d) => create.mutate({ data: d })}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-2">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded p-4 h-16 animate-pulse" />
        )) : markets.map((m) => (
          <div key={m.id} data-testid={`card-market-${m.id}`}>
            {editId === m.id ? (
              <MarketForm
                initial={m}
                onSave={(d) => update.mutate({ id: m.id, data: d })}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <div className="bg-card border border-border rounded px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="font-medium text-foreground text-sm">{m.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border ${m.status === "active" ? "border-green-800 text-green-400" : "border-border text-muted-foreground"}`}>{m.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.openTime} – {m.closeTime}</span>
                  <span className="text-xs text-muted-foreground">₹{m.minBet} – ₹{m.maxBet}</span>
                </div>
                <div className="flex gap-2">
                  <button data-testid={`button-edit-market-${m.id}`} onClick={() => setEditId(m.id)} className="p-1.5 border border-border rounded hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button data-testid={`button-delete-market-${m.id}`} onClick={() => del.mutate({ id: m.id })} className="p-1.5 border border-red-800 rounded hover:bg-red-900/20 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
