"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Bike, Search, RefreshCw, AlertCircle, CheckCircle2, X } from "lucide-react";

interface DeliveryPartnerUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    deliveries: number;
  };
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartnerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPartners = async (searchTerm = search) => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ role: "DELIVERY_PARTNER", limit: "50" });
    if (searchTerm) query.append("search", searchTerm);

    const res = await apiClient<{ users: DeliveryPartnerUser[] }>(
      `/api/admin/users?${query.toString()}`
    );
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

  const toggleStatus = async (user: DeliveryPartnerUser) => {
    setUpdatingId(user.id);
    const newStatus = !user.isActive;

    const res = await apiClient<{ user: DeliveryPartnerUser }>(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: newStatus }),
    });

    if (res.success) {
      setSuccessMessage(
        newStatus
          ? `Delivery partner '${user.name}' has been approved & verified.`
          : `Delivery partner '${user.name}' has been suspended.`
      );
      setPartners((prev) =>
        prev.map((p) => (p.id === user.id ? { ...p, isActive: newStatus } : p))
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setError(res.message || "Failed to update driver status");
    }
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Bike className="w-5 h-5 text-[#B34E22]" />
              <span>Delivery Fleet Partners</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
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
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-64 pl-9 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
            </div>
            <button
              onClick={() => fetchPartners(search)}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-colors cursor-pointer"
              title="Refresh Fleet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
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
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading delivery fleet...</span>
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <Bike className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No delivery partners found.</p>
                      <p className="text-xs text-[#9C937E] mt-1">Try searching with a different name or number.</p>
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#504932]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EBD3AA] text-[#504932] flex items-center justify-center font-bold text-xs border border-[#E8E2D5]">
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#B34E22]">{p.phoneNumber}</td>
                      <td className="py-3 px-4 text-[#7A7056]">{p.email || "—"}</td>
                      <td className="py-3 px-4 font-semibold text-[#504932]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF6ED] text-[#504932] border border-[#E8E2D5] font-bold">
                          <Bike className="w-3 h-3 text-[#B34E22]" />
                          {p._count?.deliveries ?? 0} deliveries
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-amber-50 text-amber-900 border-amber-300"
                          }`}
                        >
                          {p.isActive ? "APPROVED & READY" : "PENDING VERIFICATION"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A7056] font-medium">
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
                          style={{
                            color: p.isActive ? "#B34E22" : "#047857",
                            backgroundColor: p.isActive ? "#FFF7ED" : "#ECFDF5",
                            borderColor: p.isActive ? "#FDBA74" : "#6EE7B7",
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                            p.isActive
                              ? "hover:bg-red-50 hover:text-red-700"
                              : "hover:bg-emerald-100 hover:text-emerald-900"
                          }`}
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
