"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  DollarSign,
  ShoppingBag,
  Store,
  AlertTriangle,
  Users,
  Bike,
  Package,
  BookOpen,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardMetrics {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    placedOrders: number;
    deliveredOrders: number;
    totalCustomers: number;
    totalRetailers: number;
    totalDeliveryPartners: number;
    activeStores: number;
    totalProducts: number;
    totalRecipes: number;
    lowStockAlerts: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    storeName: string;
    storeCity: string;
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    deliveryStatus?: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient<DashboardMetrics>("/api/admin/metrics");
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || "Failed to load dashboard metrics");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PLACED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "CONFIRMED":
      case "PREPARING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Platform Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time operational metrics across stores, inventory, and fulfillment
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Error View */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMetrics}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total GMV</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">
                {isLoading ? "..." : `₹${data?.kpis.totalRevenue.toLocaleString() ?? "0"}`}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Non-cancelled orders volume</p>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">
                {isLoading ? "..." : data?.kpis.totalOrders ?? "0"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                <span className="text-blue-400 font-semibold">{data?.kpis.placedOrders ?? 0}</span> Placed •{" "}
                <span className="text-emerald-400 font-semibold">{data?.kpis.deliveredOrders ?? 0}</span> Delivered
              </p>
            </div>
          </div>

          {/* Active Stores */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dark Stores</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">
                {isLoading ? "..." : data?.kpis.activeStores ?? "0"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active fulfillment hubs</p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {isLoading ? "..." : data?.kpis.lowStockAlerts ?? "0"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Items with stock &le; 10 units</p>
            </div>
          </div>
        </div>

        {/* Secondary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Customers</p>
              <p className="text-sm font-bold text-white">{data?.kpis.totalCustomers ?? 0}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <Store className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Retailers</p>
              <p className="text-sm font-bold text-white">{data?.kpis.totalRetailers ?? 0}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <Bike className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Riders</p>
              <p className="text-sm font-bold text-white">{data?.kpis.totalDeliveryPartners ?? 0}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <Package className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Catalog Items</p>
              <p className="text-sm font-bold text-white">
                {data?.kpis.totalProducts ?? 0} prod / {data?.kpis.totalRecipes ?? 0} recip
              </p>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Dark Store</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading orders...
                    </td>
                  </tr>
                ) : data?.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{order.orderNumber}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{order.storeName}</td>
                      <td className="py-3 px-4 font-bold text-white">₹{order.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-300">
                          {order.deliveryStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
