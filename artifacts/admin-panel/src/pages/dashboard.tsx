import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { Users, TrendingUp, Clock, Wallet, Activity, Store, IndianRupee, UserPlus } from "lucide-react";

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`} className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data?.totalUsers ?? 0} icon={Users} sub={data?.newUsersToday ? `+${data.newUsersToday} today` : undefined} />
        <StatCard label="Bets Today" value={data?.totalBetsToday ?? 0} icon={Dices} sub="active sessions" />
        <StatCard label="Amount Today" value={`₹${parseFloat(data?.totalAmountToday ?? "0").toLocaleString()}`} icon={IndianRupee} />
        <StatCard label="Active Markets" value={data?.activeMarkets ?? 0} icon={Store} />
        <StatCard label="Pending Deposits" value={data?.pendingDeposits ?? 0} icon={Clock} sub="awaiting approval" />
        <StatCard label="Pending Withdrawals" value={data?.pendingWithdrawals ?? 0} icon={Wallet} sub="awaiting processing" />
        <StatCard label="New Users Today" value={data?.newUsersToday ?? 0} icon={UserPlus} />
        <StatCard label="Total Revenue" value={`₹${parseFloat(data?.totalRevenue ?? "0").toLocaleString()}`} icon={TrendingUp} />
      </div>
    </div>
  );
}

function Dices({ className }: { className?: string }) {
  return <Activity className={className} />;
}
