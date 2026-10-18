"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { Store, Search, RefreshCw, AlertCircle, CheckCircle2, X } from "lucide-react";

interface RetailerUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  managedStore?: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<RetailerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State for Action Confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    retailer: RetailerUser | null;
    action: "approve" | "suspend";
  }>({
    isOpen: false,
    retailer: null,
    action: "suspend",
  });

  const fetchRetailers = async (searchTerm = search) => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ role: "RETAILER", limit: "50" });
    if (searchTerm) query.append("search", searchTerm);

    const res = await apiClient<{ users: RetailerUser[] }>(`/api/admin/users?${query.toString()}`);
    if (res.success && res.data) {
      setRetailers(res.data.users);
    } else {
      setError(res.message || "Failed to load retailers");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const openConfirmation = (retailer: RetailerUser) => {
    setConfirmModal({
      isOpen: true,
      retailer,
      action: retailer.isActive ? "suspend" : "approve",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.retailer) return;
    const targetRetailer = confirmModal.retailer;
    const newStatus = !targetRetailer.isActive;

    setUpdatingId(targetRetailer.id);
    setConfirmModal({ isOpen: false, retailer: null, action: "suspend" });

    const res = await apiClient<{ user: RetailerUser }>(`/api/admin/users/${targetRetailer.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: newStatus }),
    });

    if (res.success) {
      setSuccessMessage(
        newStatus
          ? `Retailer '${targetRetailer.name}' has been approved & activated.`
          : `Retailer '${targetRetailer.name}' has been suspended.`
      );
      setRetailers((prev) =>
        prev.map((r) => (r.id === targetRetailer.id ? { ...r, isActive: newStatus } : r))
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setError(res.message || "Failed to update retailer status");
    }
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-[#B34E22]" />
              <span>Dark Store Retailers</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Store managers, authorization status, and dark store assignments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRetailers(search)}
                placeholder="Search retailer..."
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-64 pl-9 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
            </div>
            <button
              onClick={() => fetchRetailers(search)}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-colors cursor-pointer"
              title="Refresh Retailers"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
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

        {/* Error Banner */}
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

        {/* Retailers Table */}
        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
                <tr>
                  <th className="py-3 px-4">Retailer Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Managed Dark Store</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading retailers...</span>
                    </td>
                  </tr>
                ) : retailers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7A7056]">
                      <Store className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No retailers found.</p>
                      <p className="text-xs text-[#9C937E] mt-1">Try searching with a different term.</p>
                    </td>
                  </tr>
                ) : (
                  retailers.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#504932]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EBD3AA] text-[#504932] flex items-center justify-center font-bold text-xs border border-[#E8E2D5]">
                            {r.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[#504932] font-semibold">{r.phoneNumber}</div>
                        <div className="text-[11px] text-[#7A7056]">{r.email || "—"}</div>
                      </td>
                      <td className="py-3 px-4">
                        {r.managedStore ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#B34E22]">{r.managedStore.name}</span>
                            <span className="text-[11px] text-[#7A7056] font-medium">({r.managedStore.city})</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7A7056] bg-[#FAF6ED] px-2.5 py-0.5 rounded-md border border-[#E8E2D5] font-semibold">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            r.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {r.isActive ? "APPROVED & ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A7056] font-medium">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openConfirmation(r)}
                          disabled={updatingId === r.id}
                          style={{
                            color: r.isActive ? "#B34E22" : "#047857",
                            backgroundColor: r.isActive ? "#FFF7ED" : "#ECFDF5",
                            borderColor: r.isActive ? "#FDBA74" : "#6EE7B7",
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                            r.isActive
                              ? "hover:bg-red-50 hover:text-red-700"
                              : "hover:bg-emerald-100 hover:text-emerald-900"
                          }`}
                        >
                          {updatingId === r.id ? "Updating..." : r.isActive ? "Suspend" : "Approve Retailer"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Confirmation Modal */}
        {confirmModal.isOpen && confirmModal.retailer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmModal.action === "suspend"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#504932]">
                    {confirmModal.action === "suspend" ? "Suspend Retailer Account" : "Approve Retailer Account"}
                  </h3>
                  <p className="text-xs text-[#7A7056]">
                    {confirmModal.action === "suspend"
                      ? "This will restrict dark store inventory & order access."
                      : "This will grant access to store inventory & fulfillment."}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6ED] border border-[#E8E2D5] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#7A7056]">Retailer Name:</span>
                  <span className="font-bold text-[#504932]">{confirmModal.retailer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7056]">Phone:</span>
                  <span className="font-mono text-[#504932]">{confirmModal.retailer.phoneNumber}</span>
                </div>
                {confirmModal.retailer.managedStore && (
                  <div className="flex justify-between">
                    <span className="text-[#7A7056]">Assigned Store:</span>
                    <span className="font-bold text-[#B34E22]">{confirmModal.retailer.managedStore.name}</span>
                  </div>
                )}
              </div>

              {confirmModal.action === "suspend" && confirmModal.retailer.managedStore && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Warning:</strong> This retailer is currently managing{" "}
                  <strong>{confirmModal.retailer.managedStore.name}</strong>. Suspending will leave the store without an active manager.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, retailer: null, action: "suspend" })}
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-[#504932] hover:bg-[#E8DFC9] border-2 border-[#C8BEA7] cursor-pointer shadow-xs"
                >
                  <span style={{ color: "#504932" }} className="font-extrabold">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  style={{
                    color: "#ffffff",
                    backgroundColor: confirmModal.action === "suspend" ? "#DC2626" : "#059669",
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-md cursor-pointer ${
                    confirmModal.action === "suspend"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/25"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                  }`}
                >
                  <span style={{ color: "#ffffff" }} className="font-extrabold text-white">
                    {confirmModal.action === "suspend" ? "Confirm Suspension" : "Confirm Approval"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
