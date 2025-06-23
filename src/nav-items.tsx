import { FunctionComponent, lazy } from "react";
import { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  to: string;
  icon: string;
  page: () => Promise<{ default: FunctionComponent }>;
}

export const navItems: NavItem[] = [
  {
    title: "Home",
    to: "/",
    icon: "home",
    page: () => import("./pages/Index").then((module) => ({ default: module.default })),
  },
  {
    title: "Dashboard", 
    to: "/dashboard",
    icon: "dashboard",
    page: () => import("./pages/Dashboard").then((module) => ({ default: module.default })),
  },
  {
    title: "Onboarding",
    to: "/onboarding", 
    icon: "settings",
    page: () => import("./pages/Onboarding").then((module) => ({ default: module.default })),
  },
  {
    title: "Player",
    to: "/player",
    icon: "play",
    page: () => import("./pages/Player").then((module) => ({ default: module.default })),
  },
  {
    title: "Account",
    to: "/account",
    icon: "user",
    page: () => import("./pages/Account").then((module) => ({ default: module.default })),
  },
  {
    title: "Admin",
    to: "/admin",
    icon: "settings",
    page: () => import("./pages/Admin").then((module) => ({ default: module.default })),
  },
  {
    title: "Purchase Success",
    to: "/purchase-success",
    icon: "check",
    page: () => import("./pages/PurchaseSuccess").then((module) => ({ default: module.default })),
  },
];
