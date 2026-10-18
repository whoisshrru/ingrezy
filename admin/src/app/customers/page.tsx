"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Users, Search, RefreshCw, AlertCircle, ShoppingBag } from "lucide-react";

interface CustomerUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
    deliveries: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async (searchTerm = search) => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ role: "CUSTOMER", limit: "50" });
    if (searchTerm) query.append("search", searchTerm);

    const res = await apiClient<{ users: CustomerUser[] }>(`/api/admin/users?${query.toString()}`);
    if (res.success && res.data) {
      setCustomers(res.data.users);
    } else {
      setError(res.message || "Failed to load customers");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#B34E22]" />
              <span>Customer Management</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Registered customers, contact details, and lifetime order activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email..."
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-64 pl-9 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
            </form>
            <button
              onClick={() => fetchCustomers(search)}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-colors cursor-pointer"
              title="Refresh Customers"
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
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading customers...</span>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7A7056]">
                      <Users className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No customers found.</p>
                      <p className="text-xs text-[#9C937E] mt-1">Customers who register on the mobile app will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#504932]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EBD3AA] text-[#504932] flex items-center justify-center font-bold text-xs border border-[#E8E2D5]">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#504932]">{c.phoneNumber}</td>
                      <td className="py-3 px-4 text-[#7A7056]">{c.email || "—"}</td>
                      <td className="py-3 px-4 font-semibold text-[#504932]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF6ED] text-[#504932] border border-[#E8E2D5] font-bold">
                          <ShoppingBag className="w-3 h-3 text-[#B34E22]" />
                          {c._count.orders} orders
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {c.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#7A7056] font-medium">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
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
