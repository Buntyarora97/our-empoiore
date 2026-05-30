import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Crown } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAdminLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          setToken(data.accessToken);
          setLocation("/dashboard");
        },
        onError: () => {
          setError("Invalid username or password");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded bg-primary/20 border border-primary/30 mb-4">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-wide uppercase">Our Empire</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin Control Panel</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              data-testid="input-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p data-testid="text-login-error" className="text-destructive text-sm">{error}</p>
          )}
          <button
            data-testid="button-login"
            type="submit"
            disabled={login.isPending}
            className="w-full bg-primary text-primary-foreground rounded py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
