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
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold";
      case "PLACED":
        return "bg-blue-50 text-blue-800 border-blue-300 font-extrabold";
      case "CONFIRMED":
      case "PREPARING":
        return "bg-amber-50 text-amber-900 border-amber-300 font-extrabold";
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return "bg-orange-50 text-orange-900 border-orange-300 font-extrabold";
      case "CANCELLED":
        return "bg-red-50 text-red-800 border-red-300 font-extrabold";
      default:
        return "bg-[#FAF6ED] text-[#7A7056] border-[#E8E2D5]";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight">Platform Overview</h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Real-time operational metrics across stores, inventory, and fulfillment
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF6ED] text-[#504932] text-xs font-bold rounded-xl border border-[#E8E2D5] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            <span style={{ color: "#504932" }} className="font-bold">Refresh Data</span>
          </button>
        </div>

        {/* Error View */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMetrics}
              style={{ color: "#ffffff", backgroundColor: "#DC2626" }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Primary KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7056]">Total GMV</span>
              <div className="w-9 h-9 rounded-xl bg-[#FAF6ED] text-[#B34E22] border border-[#E8E2D5] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#B34E22]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#B34E22] tracking-tight">
                {isLoading ? "..." : `₹${Number(data?.kpis.totalRevenue || 0).toLocaleString("en-IN")}`}
              </div>
              <p className="text-[11px] text-[#7A7056] mt-1">Non-cancelled orders volume</p>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7056]">Total Orders</span>
              <div className="w-9 h-9 rounded-xl bg-[#FAF6ED] text-[#6A6332] border border-[#E8E2D5] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#6A6332]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#504932] tracking-tight">
                {isLoading ? "..." : data?.kpis.totalOrders ?? "0"}
              </div>
              <p className="text-[11px] text-[#7A7056] mt-1">
                <span className="text-[#B34E22] font-bold">{data?.kpis.placedOrders ?? 0} Placed</span> •{" "}
                <span className="text-emerald-700 font-bold">{data?.kpis.deliveredOrders ?? 0} Delivered</span>
              </p>
            </div>
          </div>

          {/* Active Stores */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7056]">Dark Stores</span>
              <div className="w-9 h-9 rounded-xl bg-[#FAF6ED] text-[#B34E22] border border-[#E8E2D5] flex items-center justify-center">
                <Store className="w-5 h-5 text-[#B34E22]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#504932] tracking-tight">
                {isLoading ? "..." : data?.kpis.activeStores ?? "0"}
              </div>
              <p className="text-[11px] text-[#7A7056] mt-1">Active fulfillment hubs</p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A7056]">Low Stock Alerts</span>
              <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#B34E22] border border-[#FDBA74] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#B34E22]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#B34E22] tracking-tight">
                {isLoading ? "..." : data?.kpis.lowStockAlerts ?? "0"}
              </div>
              <p className="text-[11px] text-[#7A7056] mt-1">Items with stock ≤ 10 units</p>
            </div>
          </div>
        </div>

        {/* Secondary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#6A6332] border border-[#E8E2D5] flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5 text-[#6A6332]" />
            </div>
            <div>
              <p className="text-[11px] text-[#7A7056] uppercase font-bold tracking-wider">Customers</p>
              <p className="text-xl font-black text-[#504932]">{data?.kpis.totalCustomers ?? 0}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#B34E22] border border-[#E8E2D5] flex items-center justify-center font-bold shrink-0">
              <Store className="w-5 h-5 text-[#B34E22]" />
            </div>
            <div>
              <p className="text-[11px] text-[#7A7056] uppercase font-bold tracking-wider">Retailers</p>
              <p className="text-xl font-black text-[#504932]">{data?.kpis.totalRetailers ?? 0}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#504932] border border-[#E8E2D5] flex items-center justify-center font-bold shrink-0">
              <Bike className="w-5 h-5 text-[#504932]" />
            </div>
            <div>
              <p className="text-[11px] text-[#7A7056] uppercase font-bold tracking-wider">Riders</p>
              <p className="text-xl font-black text-[#504932]">{data?.kpis.totalDeliveryPartners ?? 0}</p>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-4 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#B34E22] border border-[#E8E2D5] flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5 text-[#B34E22]" />
            </div>
            <div>
              <p className="text-[11px] text-[#7A7056] uppercase font-bold tracking-wider">Catalog Items</p>
              <p className="text-base font-black text-[#504932]">
                {data?.kpis.totalProducts ?? 0} prod / {data?.kpis.totalRecipes ?? 0} recip
              </p>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white border border-[#E8E2D5] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E8E2D5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B34E22]" />
              <h3 className="text-sm font-bold text-[#504932]">Recent Customer Orders</h3>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-[#B34E22] hover:text-[#8F3E1A] flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Dark Store</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4 text-right">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading recent orders...</span>
                    </td>
                  </tr>
                ) : data?.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <ShoppingBag className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No orders placed yet.</p>
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#B34E22]">{order.orderNumber}</td>
                      <td className="py-3 px-4 font-bold text-[#504932]">
                        <div>{order.customerName}</div>
                        <div className="text-[11px] text-[#7A7056] font-mono font-normal">{order.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-[#504932] font-semibold">{order.storeName}</td>
                      <td className="py-3 px-4 font-extrabold text-[#B34E22]">₹{Number(order.totalAmount).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold text-[#7A7056] bg-[#FAF6ED] px-2 py-0.5 rounded-md border border-[#E8E2D5]">
                          {order.deliveryStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#7A7056] font-medium">
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
