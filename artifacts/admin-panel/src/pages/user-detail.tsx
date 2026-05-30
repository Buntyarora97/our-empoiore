import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useAdminGetUser,
  useAdminUpdateUserBalance,
  useAdminUpdateUserStatus,
  getAdminGetUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? "", 10);
  const { data: user, isLoading } = useAdminGetUser(userId, {
    query: { enabled: !!userId, queryKey: getAdminGetUserQueryKey(userId) },
  });
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateBalance = useAdminUpdateUserBalance({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
        setAmount("");
        setReason("");
        toast({ title: "Balance updated" });
      },
    },
  });

  const updateStatus = useAdminUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
        toast({ title: "Status updated" });
      },
    },
  });

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!user) return <div className="text-muted-foreground">User not found</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <span className="p-1.5 border border-border rounded hover:bg-muted cursor-pointer inline-flex">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{user.fullName}</h1>
        <span className={`text-xs px-2 py-0.5 rounded border ${user.status === "active" ? "border-green-800 text-green-400" : "border-red-800 text-red-400"}`}>
          {user.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Phone" value={user.phone} />
        <InfoCard label="Email" value={user.email ?? "—"} />
        <InfoCard label="Balance" value={`₹${parseFloat(user.balance).toLocaleString()}`} />
        <InfoCard label="Referral Code" value={user.referralCode ?? "—"} />
        <InfoCard label="Total Bets" value={String(user.totalBets)} />
        <InfoCard label="Total Deposits" value={`₹${parseFloat(user.totalDeposits ?? "0").toLocaleString()}`} />
        <InfoCard label="Total Withdrawals" value={`₹${parseFloat(user.totalWithdrawals ?? "0").toLocaleString()}`} />
        <InfoCard label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
      </div>

      <div className="bg-card border border-border rounded p-4 space-y-3">
        <h2 className="text-sm font-medium text-foreground">Adjust Balance</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              data-testid="input-balance-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (negative to deduct)"
              className="w-full pl-7 pr-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <input
            data-testid="input-balance-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="flex-1 px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            data-testid="button-adjust-balance"
            onClick={() => {
              if (!amount || !reason) return;
              updateBalance.mutate({ id: userId, data: { amount, reason } });
            }}
            disabled={updateBalance.isPending}
            className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          data-testid={`button-toggle-status-${userId}`}
          onClick={() => updateStatus.mutate({ id: userId, data: { status: user.status === "active" ? "blocked" : "active" } })}
          className={`px-4 py-2 text-sm rounded border transition-colors ${
            user.status === "active"
              ? "border-red-800 text-red-400 hover:bg-red-900/20"
              : "border-green-800 text-green-400 hover:bg-green-900/20"
          }`}
        >
          {user.status === "active" ? "Block User" : "Unblock User"}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded px-4 py-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p data-testid={`text-${label.toLowerCase().replace(/\s/g, "-")}`} className="text-sm font-medium text-foreground mt-1">{value}</p>
    </div>
  );
}
