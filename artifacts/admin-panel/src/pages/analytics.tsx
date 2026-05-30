import { useState } from "react";
import {
  useAdminGetRevenueAnalytics,
  getAdminGetRevenueAnalyticsQueryKey,
} from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const PERIODS = [
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
  { key: "year", label: "365 Days" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("week");
  const { data, isLoading } = useAdminGetRevenueAnalytics(
    { period },
    { query: { queryKey: getAdminGetRevenueAnalyticsQueryKey({ period }) } }
  );

  const chartData = (data?.data ?? []).map((d) => ({
    date: d.date.slice(5),
    Revenue: parseFloat(d.revenue),
    Deposits: parseFloat(d.deposits),
    Withdrawals: parseFloat(d.withdrawals),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Revenue Analytics</h1>
        <div className="flex gap-1">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${period === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p data-testid="stat-total-revenue" className="text-2xl font-bold text-primary mt-1">₹{parseFloat(data?.totalRevenue ?? "0").toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deposits</p>
          <p data-testid="stat-total-deposits" className="text-2xl font-bold text-foreground mt-1">₹{parseFloat(data?.totalDeposits ?? "0").toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Withdrawals</p>
          <p data-testid="stat-total-withdrawals" className="text-2xl font-bold text-foreground mt-1">₹{parseFloat(data?.totalWithdrawals ?? "0").toLocaleString()}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded p-4 h-64 animate-pulse" />
      ) : (
        <div className="bg-card border border-border rounded p-4">
          <h2 className="text-sm font-medium text-foreground mb-4">Revenue Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(90 31% 51%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(90 31% 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(117 49% 19% / 0.4)" />
              <XAxis dataKey="date" stroke="hsl(0 0% 65%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(0 0% 65%)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(117 49% 19%)", borderRadius: "4px" }} />
              <Area type="monotone" dataKey="Revenue" stroke="hsl(90 31% 51%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && (
        <div className="bg-card border border-border rounded p-4">
          <h2 className="text-sm font-medium text-foreground mb-4">Deposits vs Withdrawals</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(117 49% 19% / 0.4)" />
              <XAxis dataKey="date" stroke="hsl(0 0% 65%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(0 0% 65%)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(117 49% 19%)", borderRadius: "4px" }} />
              <Legend />
              <Bar dataKey="Deposits" fill="hsl(90 31% 51%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Withdrawals" fill="hsl(0 84% 60%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
