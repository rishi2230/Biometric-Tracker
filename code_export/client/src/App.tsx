import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Courses from "@/pages/Courses";
import Attendance from "@/pages/Attendance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { Suspense, lazy, useEffect } from "react";

function AppContent() {
  const { user, loading, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && location !== "/login") {
    return null;
  }

  if (location === "/login") {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/students" component={Students} />
            <Route path="/courses" component={Courses} />
            <Route path="/attendance" component={Attendance} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppContent />
        <Toaster />
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
