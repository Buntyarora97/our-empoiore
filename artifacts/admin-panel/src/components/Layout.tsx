import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/auth";
import {
  LayoutDashboard, Users, Store, Trophy, ArrowDownToLine,
  ArrowUpFromLine, Dices, BarChart3, Settings, Bell, LogOut, Crown
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/users", label: "Users", icon: Users },
  { path: "/markets", label: "Markets", icon: Store },
  { path: "/results", label: "Results", icon: Trophy },
  { path: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { path: "/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { path: "/bets", label: "Bets", icon: Dices },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  function handleLogout() {
    clearToken();
    setLocation("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <Crown className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-wider uppercase text-foreground">Our Empire</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/dashboard" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <div
                  data-testid={`nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    active
                      ? "bg-primary/15 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
