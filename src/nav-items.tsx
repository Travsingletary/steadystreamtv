
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Player from "./pages/Player";
import Favorites from "./pages/Favorites";
import Account from "./pages/Account";
import ConnectApps from "./pages/ConnectApps";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import SteadyStreamAdminDashboard from "./pages/SteadyStreamAdminDashboard";
import TestXtreamAccount from "./pages/TestXtreamAccount";
import CustomDashboardAdminPage from "./pages/CustomDashboardAdmin";
import MegaOTTTesterPage from "./pages/MegaOTTTester";
import NotFound from "./pages/NotFound";

export const navItems = [
  {
    to: "/",
    page: <Index />,
  },
  {
    to: "/onboarding",
    page: <Onboarding />,
  },
  {
    to: "/dashboard",
    page: <Dashboard />,
  },
  {
    to: "/player",
    page: <Player />,
  },
  {
    to: "/favorites",
    page: <Favorites />,
  },
  {
    to: "/account",
    page: <Account />,
  },
  {
    to: "/connect-apps",
    page: <ConnectApps />,
  },
  {
    to: "/admin-login",
    page: <AdminLogin />,
  },
  {
    to: "/admin",
    page: <SteadyStreamAdminDashboard />,
  },
  {
    to: "/custom-dashboard-admin",
    page: <CustomDashboardAdminPage />,
  },
  {
    to: "/megaott-tester",
    page: <MegaOTTTesterPage />,
  },
  {
    to: "/test-xtream",
    page: <TestXtreamAccount />,
  },
  {
    to: "*",
    page: <NotFound />,
  },
];
