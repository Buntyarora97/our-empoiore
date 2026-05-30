import { useState } from "react";
import {
  useAdminGetBets,
  useAdminGetBetAnalytics,
  getAdminGetBetsQueryKey,
  getAdminGetBetAnalyticsQueryKey,
} from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT = 20;

const GAME_LABELS: Record<string, string> = {
  jantri: "Jantri",
  open: "Open",
  crossing: "Crossing",
  no_to_no: "No-to-No",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "border-yellow-800 text-yellow-400",
    won: "border-green-800 text-green-400",
    lost: "border-red-800 text-red-400",
    cancelled: "border-border text-muted-foreground",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border ${colors[status] ?? "border-border text-muted-foreground"}`}>{status}</span>;
}

export default function BetsPage() {
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<"list" | "analytics">("list");

  const { data, isLoading } = useAdminGetBets(
    { limit: LIMIT, offset },
    { query: { queryKey: getAdminGetBetsQueryKey({ limit: LIMIT, offset }) } }
  );
  const { data: analytics } = useAdminGetBetAnalytics(
    {},
    { query: { queryKey: getAdminGetBetAnalyticsQueryKey({}) } }
  );

  const bets = data?.bets ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Bets</h1>
        <div className="flex gap-1">
          <button onClick={() => setTab("list")} className={`px-3 py-1 text-xs rounded border transition-colors ${tab === "list" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>List</button>
          <button onClick={() => setTab("analytics")} className={`px-3 py-1 text-xs rounded border transition-colors ${tab === "analytics" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>Analytics</button>
        </div>
      </div>

      {tab === "analytics" && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bets</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalBets}</p>
            </div>
            <div className="bg-card border border-border rounded p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{parseFloat(analytics.totalAmount).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Top Numbers</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Number</th>
                  <th className="text-right px-4 py-2">Bet Count</th>
                  <th className="text-right px-4 py-2">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {analytics.numberStats.slice(0, 20).map((s) => (
                  <tr key={s.number} className="border-b border-border/50">
                    <td className="px-4 py-2 font-mono font-bold text-primary">{s.number}</td>
                    <td className="px-4 py-2 text-right">{s.betCount}</td>
                    <td className="px-4 py-2 text-right font-mono">₹{parseFloat(s.totalAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "list" && (
        <>
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Market</th>
                  <th className="text-left px-4 py-3">Game Type</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>)}</tr>
                )) : bets.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No bets found</td></tr>
                ) : bets.map((b) => (
                  <tr key={b.id} data-testid={`row-bet-${b.id}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">#{b.id}</td>
                    <td className="px-4 py-3">#{b.userId}</td>
                    <td className="px-4 py-3">{b.marketName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{GAME_LABELS[b.gameType] ?? b.gameType}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{parseFloat(b.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > LIMIT && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
              <div className="flex gap-2">
                <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="p-1.5 border border-border rounded hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)} className="p-1.5 border border-border rounded hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
