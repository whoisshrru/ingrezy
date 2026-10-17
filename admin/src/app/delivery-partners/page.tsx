"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Bike, Search, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";

interface DeliveryUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    deliveries: number;
  };
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPartners = async (searchTerm = search) => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ role: "DELIVERY_PARTNER", limit: "50" });
    if (searchTerm) query.append("search", searchTerm);

    const res = await apiClient<{ users: DeliveryUser[] }>(`/api/admin/users?${query.toString()}`);
    if (res.success && res.data) {
      setPartners(res.data.users);
    } else {
      setError(res.message || "Failed to load delivery partners");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const toggleStatus = async (user: DeliveryUser) => {
    setUpdatingId(user.id);
    const res = await apiClient(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    if (res.success) {
      setPartners((prev) =>
        prev.map((p) => (p.id === user.id ? { ...p, isActive: !user.isActive } : p))
      );
    } else {
      alert(res.message || "Failed to update driver status");
    }
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Bike className="w-5 h-5 text-purple-400" />
              <span>Delivery Fleet Partners</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rider fleet, onboarding verification, and fulfilled drop-off statistics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchPartners(search)}
                placeholder="Search delivery partner..."
                className="w-64 pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <button
              onClick={() => fetchPartners(search)}
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
                  <th className="py-3 px-4">Partner Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assignments Handled</th>
                  <th className="py-3 px-4">Fleet Status</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading delivery fleet...
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No delivery partners found.
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                          {p.name.slice(0, 1)}
                        </div>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-400">{p.phoneNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{p.email || "—"}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          <Bike className="w-3 h-3 text-purple-400" />
                          {p._count?.deliveries ?? 0} deliveries
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {p.isActive ? "APPROVED & READY" : "PENDING VERIFICATION"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleStatus(p)}
                          disabled={updatingId === p.id}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            p.isActive
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          } disabled:opacity-50`}
                        >
                          {updatingId === p.id ? "Updating..." : p.isActive ? "Suspend" : "Approve Rider"}
                        </button>
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
