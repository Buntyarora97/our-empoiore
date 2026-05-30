import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initAuth, isAuthenticated } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import UserDetailPage from "@/pages/user-detail";
import MarketsPage from "@/pages/markets";
import ResultsPage from "@/pages/results";
import DepositsPage from "@/pages/deposits";
import WithdrawalsPage from "@/pages/withdrawals";
import BetsPage from "@/pages/bets";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import Layout from "@/components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/users/:id" component={() => <ProtectedRoute component={UserDetailPage} />} />
      <Route path="/markets" component={() => <ProtectedRoute component={MarketsPage} />} />
      <Route path="/results" component={() => <ProtectedRoute component={ResultsPage} />} />
      <Route path="/deposits" component={() => <ProtectedRoute component={DepositsPage} />} />
      <Route path="/withdrawals" component={() => <ProtectedRoute component={WithdrawalsPage} />} />
      <Route path="/bets" component={() => <ProtectedRoute component={BetsPage} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
