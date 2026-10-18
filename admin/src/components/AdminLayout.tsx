"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  Package,
  BookOpen,
  ShoppingBag,
  Boxes,
  LogOut,
  ShieldCheck,
  Building2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Retailers", href: "/retailers", icon: Store },
  { label: "Delivery Partners", href: "/delivery-partners", icon: Bike },
  { label: "Dark Stores", href: "/stores", icon: Building2 },
  { label: "Products Catalog", href: "/products", icon: Package },
  { label: "Recipes", href: "/recipes", icon: BookOpen },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Inventory", href: "/inventory", icon: Boxes },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5] text-[#504932]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B34E22] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#504932]">Loading Ingrezy Admin...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFCF5] text-[#504932] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E2D5] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#B34E22] flex items-center justify-center font-bold text-white shadow-sm shadow-[#B34E22]/20">
            I
          </div>
          <span className="font-bold text-lg tracking-tight text-[#504932]">
            Ingrezy <span className="text-[#B34E22] text-xs font-semibold uppercase tracking-wider ml-1">Admin</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-[#FAF6ED] text-[#504932] hover:bg-[#F5EFE3] border border-[#E8E2D5]"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8E2D5] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E8E2D5] gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B34E22] to-[#EBD3AA] flex items-center justify-center font-black text-white text-lg shadow-md shadow-[#B34E22]/20">
            IN
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-[#504932] flex items-center gap-1.5">
              Ingrezy
              <span className="bg-[#EBD3AA]/60 text-[#504932] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#E8E2D5]">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#7A7056]">Operations Control</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-[#7A7056] uppercase">
            Platform Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#B34E22] text-white font-bold shadow-sm shadow-[#B34E22]/25"
                    : "text-[#504932] hover:text-[#B34E22] hover:bg-[#FAF6ED]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#7A7056]"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/90" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#E8E2D5] bg-[#FAF6ED]/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8E2D5] shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#EBD3AA] text-[#504932] flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#B34E22]" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#504932] truncate">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-[#B34E22] font-semibold">Platform Admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout from Admin Panel"
              className="p-1.5 rounded-lg text-[#7A7056] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[#E8E2D5] bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#504932] capitalize">
              {pathname === "/dashboard" ? "Platform Overview" : pathname.replace("/", "").replace("-", " ")}
            </h1>
            <span className="text-xs text-[#7A7056] font-medium">•</span>
            <span className="text-xs font-semibold text-[#6A6332] flex items-center gap-1.5 bg-[#FAF6ED] px-2.5 py-1 rounded-full border border-[#E8E2D5]">
              <span className="w-2 h-2 rounded-full bg-[#6A6332] animate-pulse" />
              Backend Connected (Port 5000)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#504932]">{user?.name}</p>
              <p className="text-[11px] text-[#7A7056]">{user?.email || user?.phoneNumber}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EBD3AA] border border-[#E8E2D5] flex items-center justify-center text-xs font-bold text-[#504932] shadow-xs">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 bg-[#FFFCF5]">{children}</main>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}
    </div>
  );
}
