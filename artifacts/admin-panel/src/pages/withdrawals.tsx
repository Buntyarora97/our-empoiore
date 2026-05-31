import { useState } from "react";
import {
  useAdminGetWithdrawals,
  useAdminCompleteWithdrawal,
  useAdminRejectWithdrawal,
  getAdminGetWithdrawalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LIMIT = 20;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "border-yellow-800 text-yellow-400",
    completed: "border-green-800 text-green-400",
    rejected: "border-red-800 text-red-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border ${colors[status] ?? "border-border text-muted-foreground"}`}>{status}</span>;
}

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  status: string;
  method?: string | null;
  utrNumber?: string | null;
  upiId?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  createdAt: string;
  userName?: string | null;
}

export default function WithdrawalsPage() {
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useAdminGetWithdrawals(
    { status: statusFilter || undefined, limit: LIMIT, offset },
    { query: { queryKey: getAdminGetWithdrawalsQueryKey({ status: statusFilter || undefined, limit: LIMIT, offset }) } }
  );

  const inv = () => qc.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() });
  const complete = useAdminCompleteWithdrawal({ mutation: { onSuccess: () => { inv(); toast({ title: "Withdrawal completed" }); } } });
  const reject = useAdminRejectWithdrawal({ mutation: { onSuccess: () => { inv(); toast({ title: "Withdrawal rejected and refunded" }); } } });

  const txs = (data?.transactions ?? []) as Withdrawal[];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Withdrawals</h1>
        <div className="flex gap-1">
          {["pending", "completed", "rejected", ""].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setOffset(0); }}
              className={`px-3 py-1 text-xs rounded border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Payment Info</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>)}</tr>
            )) : txs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No withdrawals found</td></tr>
            ) : txs.map((tx) => (
              <>
                <tr key={tx.id} data-testid={`row-withdrawal-${tx.id}`}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                >
                  <td className="px-4 py-3 text-muted-foreground">#{tx.id}</td>
                  <td className="px-4 py-3 font-medium">{tx.userName ?? `User #${tx.userId}`}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">₹{parseFloat(tx.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {tx.upiId ? (
                      <span className="font-mono text-xs text-primary">{tx.upiId}</span>
                    ) : tx.accountNumber ? (
                      <span className="font-mono text-xs text-muted-foreground">Acc: {tx.accountNumber}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{tx.method ?? "UPI"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {tx.status === "pending" && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button data-testid={`button-complete-withdrawal-${tx.id}`} onClick={() => complete.mutate({ id: tx.id })} className="p-1.5 border border-green-800 rounded hover:bg-green-900/20 text-green-400 transition-colors" title="Mark Completed"><Check className="w-3.5 h-3.5" /></button>
                        <button data-testid={`button-reject-withdrawal-${tx.id}`} onClick={() => reject.mutate({ id: tx.id, data: { reason: "Rejected by admin" } })} className="p-1.5 border border-red-800 rounded hover:bg-red-900/20 text-red-400 transition-colors" title="Reject & Refund"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedId === tx.id && (
                  <tr key={`expanded-${tx.id}`} className="bg-muted/30 border-b border-border/50">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground uppercase tracking-wider">Payment Method</span>
                          <p className="font-medium text-foreground mt-1">{tx.method ?? "UPI"}</p>
                        </div>
                        {tx.upiId && (
                          <div>
                            <span className="text-muted-foreground uppercase tracking-wider">UPI ID</span>
                            <p className="font-mono font-medium text-primary mt-1">{tx.upiId}</p>
                          </div>
                        )}
                        {tx.accountNumber && (
                          <div>
                            <span className="text-muted-foreground uppercase tracking-wider">Account Number</span>
                            <p className="font-mono font-medium text-foreground mt-1">{tx.accountNumber}</p>
                          </div>
                        )}
                        {tx.ifscCode && (
                          <div>
                            <span className="text-muted-foreground uppercase tracking-wider">IFSC Code</span>
                            <p className="font-mono font-medium text-foreground mt-1">{tx.ifscCode}</p>
                          </div>
                        )}
                        {tx.utrNumber && (
                          <div>
                            <span className="text-muted-foreground uppercase tracking-wider">UTR Number</span>
                            <p className="font-mono font-medium text-foreground mt-1">{tx.utrNumber}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
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
    </div>
  );
}
