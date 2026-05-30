import { useState } from "react";
import { Link } from "wouter";
import {
  useAdminGetUsers,
  useAdminUpdateUserStatus,
  getAdminGetUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LIMIT = 20;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-900/30 text-green-400 border-green-800",
    blocked: "bg-red-900/30 text-red-400 border-red-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useAdminGetUsers(
    { search: search || undefined, limit: LIMIT, offset },
    { query: { queryKey: getAdminGetUsersQueryKey({ search: search || undefined, limit: LIMIT, offset }) } }
  );

  const updateStatus = useAdminUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        toast({ title: "Status updated" });
      },
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Users</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          data-testid="input-search-users"
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-right px-4 py-3">Balance</th>
              <th className="text-right px-4 py-3">Bets</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} data-testid={`row-user-${user.id}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/users/${user.id}`}>
                      <span className="text-primary hover:underline cursor-pointer font-medium">{user.fullName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{parseFloat(user.balance).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{user.totalBets}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`button-toggle-status-${user.id}`}
                      onClick={() => updateStatus.mutate({ id: user.id, data: { status: user.status === "active" ? "blocked" : "active" } })}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        user.status === "active"
                          ? "border-red-800 text-red-400 hover:bg-red-900/30"
                          : "border-green-800 text-green-400 hover:bg-green-900/30"
                      }`}
                    >
                      {user.status === "active" ? "Block" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="p-1.5 border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className="p-1.5 border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
