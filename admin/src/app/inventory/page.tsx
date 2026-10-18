"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Boxes, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, Package } from "lucide-react";

interface InventoryRecord {
  id: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  productId: string;
  productName: string;
  productCategory: string;
  productUnit: string;
  productImageUrl: string | null;
  basePrice: number;
  storePrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  isLowStock: boolean;
  updatedAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (lowStockFilter) query.append("lowStock", "true");

    const res = await apiClient<{ inventories: InventoryRecord[] }>(
      `/api/admin/inventory?${query.toString()}`
    );
    if (res.success && res.data) {
      setItems(res.data.inventories);
    } else {
      setError(res.message || "Failed to load inventory");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#B34E22]" />
              <span>Multi-Store Inventory Overview</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Current stock levels, replenishment alerts, and localized store pricing across dark stores
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              style={{
                color: lowStockFilter ? "#ffffff" : "#504932",
                backgroundColor: lowStockFilter ? "#B34E22" : "#FFFFFF",
                borderColor: lowStockFilter ? "#B34E22" : "#E8E2D5",
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-xs cursor-pointer ${
                lowStockFilter
                  ? "bg-[#B34E22] text-white shadow-sm"
                  : "bg-white text-[#504932] hover:bg-[#FAF6ED]"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? "text-white" : "text-[#B34E22]"}`} />
              <span style={{ color: lowStockFilter ? "#ffffff" : "#504932" }} className="font-extrabold">
                {lowStockFilter ? "Showing Low Stock (≤10)" : "Filter Low Stock"}
              </span>
            </button>

            <button
              onClick={fetchInventory}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-colors cursor-pointer"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Dark Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Store Price</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4">Status Alert</th>
                  <th className="py-3 px-4">Last Stock Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading multi-store inventory...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <Package className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No inventory records found.</p>
                      <p className="text-xs text-[#9C937E] mt-1">
                        {lowStockFilter
                          ? "Great news! No stores currently have depleted inventory (≤10)."
                          : "No catalog items allocated to dark stores yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] overflow-hidden shrink-0 border border-[#E8E2D5] flex items-center justify-center">
                            {inv.productImageUrl ? (
                              <img
                                src={inv.productImageUrl}
                                alt={inv.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[#9C937E]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#504932] text-xs">{inv.productName}</div>
                            <div className="text-[11px] text-[#7A7056] font-medium">{inv.productUnit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#504932]">
                        <div className="font-bold">{inv.storeName}</div>
                        <div className="text-[11px] text-[#7A7056]">{inv.storeCity}</div>
                      </td>
                      <td className="py-3 px-4 text-[#504932] font-semibold">{inv.productCategory}</td>
                      <td className="py-3 px-4 font-extrabold text-[#B34E22] text-sm">
                        ₹{Number(inv.storePrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                            inv.stockQuantity <= 10
                              ? "bg-red-50 text-red-800 border-red-300"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {inv.stockQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {inv.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF7ED] text-[#B34E22] border border-[#FDBA74]">
                            <AlertTriangle className="w-3 h-3 text-[#B34E22]" />
                            REPLENISH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#7A7056] font-medium">
                        {new Date(inv.updatedAt).toLocaleDateString("en-IN", {
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
