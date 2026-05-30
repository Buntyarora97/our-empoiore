import { useState } from "react";
import {
  useAdminGetMarkets,
  useAdminAddResult,
  useAdminUpdateResult,
  useGetRecentResults,
  getGetRecentResultsQueryKey,
  getAdminGetMarketsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResultsPage() {
  const { data: markets = [] } = useAdminGetMarkets({ query: { queryKey: getAdminGetMarketsQueryKey() } });
  const { data: results = [], isLoading } = useGetRecentResults({ query: { queryKey: getGetRecentResultsQueryKey() } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: getGetRecentResultsQueryKey() });

  const [form, setForm] = useState({ marketId: "", date: new Date().toISOString().split("T")[0] ?? "", openNumber: "", closeNumber: "", jodiNumber: "", status: "declared" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const addResult = useAdminAddResult({ mutation: { onSuccess: () => { inv(); setForm(f => ({ ...f, openNumber: "", closeNumber: "", jodiNumber: "" })); toast({ title: "Result declared" }); } } });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Results</h1>

      <div className="bg-card border border-border rounded p-4 space-y-3">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-2"><Plus className="w-4 h-4" />Declare Result</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Market</label>
            <select data-testid="select-result-market" value={form.marketId} onChange={set("marketId")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select market</option>
              {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <input type="date" value={form.date} onChange={set("date")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={form.status} onChange={set("status")} className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="declared">Declared</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Open Number</label>
            <input data-testid="input-open-number" value={form.openNumber} onChange={set("openNumber")} maxLength={3} placeholder="000" className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Close Number</label>
            <input data-testid="input-close-number" value={form.closeNumber} onChange={set("closeNumber")} maxLength={3} placeholder="000" className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Jodi Number</label>
            <input data-testid="input-jodi-number" value={form.jodiNumber} onChange={set("jodiNumber")} maxLength={2} placeholder="00" className="w-full mt-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
          </div>
        </div>
        <button
          data-testid="button-declare-result"
          onClick={() => {
            if (!form.marketId) return;
            addResult.mutate({ data: { marketId: parseInt(form.marketId), date: form.date, openNumber: form.openNumber || null, closeNumber: form.closeNumber || null, jodiNumber: form.jodiNumber || null, status: form.status } });
          }}
          disabled={addResult.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Check className="w-4 h-4" />Declare
        </button>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Market</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-center px-4 py-3">Open</th>
              <th className="text-center px-4 py-3">Jodi</th>
              <th className="text-center px-4 py-3">Close</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>)}
                </tr>
              ))
            ) : results.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No results declared yet</td></tr>
            ) : results.map((r) => (
              <tr key={r.id} data-testid={`row-result-${r.id}`} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium">{r.marketName}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                <td className="px-4 py-3 text-center font-mono">{r.openNumber ?? "—"}</td>
                <td className="px-4 py-3 text-center font-mono text-primary font-bold">{r.jodiNumber ?? "—"}</td>
                <td className="px-4 py-3 text-center font-mono">{r.closeNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${r.status === "declared" ? "border-green-800 text-green-400" : "border-yellow-800 text-yellow-400"}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
