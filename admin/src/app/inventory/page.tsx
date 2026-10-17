"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Boxes, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

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
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <span>Multi-Store Inventory Overview</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current stock levels, replenishment alerts, and localized store pricing across dark stores
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                lowStockFilter
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockFilter ? "Showing Low Stock (&le;10)" : "Filter Low Stock"}</span>
            </button>

            <button
              onClick={fetchInventory}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold">
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
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  items.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                            {inv.productImageUrl ? (
                              <img
                                src={inv.productImageUrl}
                                alt={inv.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                IN
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{inv.productName}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{inv.productUnit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div>{inv.storeName}</div>
                        <div className="text-[10px] text-slate-500">{inv.storeCity}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{inv.productCategory}</td>
                      <td className="py-3 px-4 font-bold text-white text-sm">₹{inv.storePrice}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                            inv.stockQuantity <= 10
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {inv.stockQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {inv.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            REPLENISH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
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
