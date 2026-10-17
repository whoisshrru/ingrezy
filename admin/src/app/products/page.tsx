"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Package, Search, RefreshCw, AlertCircle, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  unit: string;
  basePrice: string | number;
  imageUrl: string | null;
  dietaryType: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: "100" });
    if (selectedCategory !== "ALL") query.append("category", selectedCategory);
    if (search) query.append("search", search);

    const res = await apiClient<{ products: Product[] }>(`/api/products?${query.toString()}`);
    if (res.success && res.data) {
      setProducts(res.data.products);
    } else {
      setError(res.message || "Failed to load products");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const categories = ["ALL", "Vegetables", "Dairy", "Meat", "Bakery", "Pantry", "Grains", "Snacks"];

  const getDietaryBadge = (type: string) => {
    switch (type) {
      case "VEG":
        return "border-emerald-500 text-emerald-400 bg-emerald-500/10";
      case "NON_VEG":
        return "border-red-500 text-red-400 bg-red-500/10";
      case "CONTAINS_EGG":
        return "border-amber-500 text-amber-400 bg-amber-500/10";
      default:
        return "border-slate-500 text-slate-400 bg-slate-500/10";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>Products Master Catalog</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Master catalog items, base pricing, packaging units, and dietary tags
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                placeholder="Search products..."
                className="w-56 pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={fetchProducts}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
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
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit / Package</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Dietary Type</th>
                  <th className="py-3 px-4">Catalog Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                IN
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{p.unit}</td>
                      <td className="py-3 px-4 font-bold text-white text-sm">₹{Number(p.basePrice).toFixed(0)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDietaryBadge(
                            p.dietaryType
                          )}`}
                        >
                          {p.dietaryType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {p.isActive ? "PUBLISHED" : "UNLISTED"}
                        </span>
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
