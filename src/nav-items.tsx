
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Player from "./pages/Player";
import Favorites from "./pages/Favorites";
import Account from "./pages/Account";
import ConnectApps from "./pages/ConnectApps";
import AdminDashboard from "./pages/AdminDashboard";
import TestXtreamAccount from "./pages/TestXtreamAccount";
import Auth from "./pages/Auth";
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
    to: "/admin",
    page: <AdminDashboard />,
  },
  {
    to: "/test-xtream",
    page: <TestXtreamAccount />,
  },
  {
    to: "/auth",
    page: <Auth />,
  },
  {
    to: "*",
    page: <NotFound />,
  },
];
