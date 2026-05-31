import { useGetAdminDashboard, getGetAdminDashboardQueryKey, useAdminGetBets, useAdminGetUsers, getAdminGetBetsQueryKey, getAdminGetUsersQueryKey } from "@workspace/api-client-react";
import { Users, TrendingUp, Clock, Wallet, Activity, Store, IndianRupee, UserPlus } from "lucide-react";

function StatCard({ label, value, icon: Icon, sub, highlight }: { label: string; value: string | number; icon: React.ElementType; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded p-4 ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded flex items-center justify-center ${highlight ? "bg-primary/20" : "bg-primary/10"}`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-primary"}`} />
        </div>
      </div>
    </div>
  );
}

function RecentBetRow({ bet }: { bet: { id: number; marketName?: string; gameType: string; totalAmount: string; status: string; createdAt: string } }) {
  const statusClr: Record<string, string> = {
    pending: "text-yellow-400",
    won: "text-green-400",
    lost: "text-red-400",
  };
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{bet.marketName ?? "Market"}</span>
        <span className="text-xs text-muted-foreground capitalize">{bet.gameType.replace("_", "-")}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-foreground">₹{parseFloat(bet.totalAmount).toLocaleString()}</span>
        <span className={`text-xs font-semibold uppercase ${statusClr[bet.status] ?? "text-muted-foreground"}`}>{bet.status}</span>
      </div>
    </div>
  );
}

function RecentUserRow({ user }: { user: { id: number; fullName: string; phone: string; balance: string; status: string; createdAt: string } }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{user.fullName}</span>
        <span className="text-xs text-muted-foreground">{user.phone}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-green-400">₹{parseFloat(user.balance).toLocaleString()}</span>
        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${user.status === "active" ? "border-green-800 text-green-400" : "border-red-800 text-red-400"}`}>
          {user.status}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });
  const { data: recentBetsData } = useAdminGetBets(
    { limit: 5, offset: 0 },
    { query: { queryKey: getAdminGetBetsQueryKey({ limit: 5, offset: 0 }) } }
  );
  const { data: recentUsersData } = useAdminGetUsers(
    { limit: 5, offset: 0 },
    { query: { queryKey: getAdminGetUsersQueryKey({ limit: 5, offset: 0 }) } }
  );

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

  const recentBets = (recentBetsData?.bets ?? []) as Array<{ id: number; marketName?: string; gameType: string; totalAmount: string; status: string; createdAt: string }>;
  const recentUsers = (recentUsersData?.users ?? []) as Array<{ id: number; fullName: string; phone: string; balance: string; status: string; createdAt: string }>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data?.totalUsers ?? 0} icon={Users} sub={data?.newUsersToday ? `+${data.newUsersToday} today` : undefined} />
        <StatCard label="Bets Today" value={data?.totalBetsToday ?? 0} icon={Activity} sub="placed today" />
        <StatCard label="Amount Today" value={`₹${parseFloat(data?.totalAmountToday ?? "0").toLocaleString()}`} icon={IndianRupee} highlight />
        <StatCard label="Active Markets" value={data?.activeMarkets ?? 0} icon={Store} />
        <StatCard label="Pending Deposits" value={data?.pendingDeposits ?? 0} icon={Clock} sub="need approval" highlight={Number(data?.pendingDeposits ?? 0) > 0} />
        <StatCard label="Pending Withdrawals" value={data?.pendingWithdrawals ?? 0} icon={Wallet} sub="need processing" highlight={Number(data?.pendingWithdrawals ?? 0) > 0} />
        <StatCard label="New Users Today" value={data?.newUsersToday ?? 0} icon={UserPlus} />
        <StatCard label="Total Revenue" value={`₹${parseFloat(data?.totalRevenue ?? "0").toLocaleString()}`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bets */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Bets</h2>
            <a href="/bets" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          {recentBets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No bets yet</p>
          ) : (
            recentBets.map((bet) => <RecentBetRow key={bet.id} bet={bet} />)
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Users</h2>
            <a href="/users" className="text-xs text-primary hover:underline">View all →</a>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No users yet</p>
          ) : (
            recentUsers.map((user) => <RecentUserRow key={user.id} user={user} />)
          )}
        </div>
      </div>
    </div>
  );
}
