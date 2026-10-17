"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  Store,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

interface RetailerUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  managedStore: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<RetailerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Safeguard Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    retailer: RetailerUser | null;
    action: "suspend" | "approve";
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
    const { retailer, action } = confirmModal;
    if (!retailer) return;

    setConfirmModal({ isOpen: false, retailer: null, action: "suspend" });
    setUpdatingId(retailer.id);
    setError(null);
    setSuccessMessage(null);

    const newStatus = action === "approve";
    const res = await apiClient(`/api/admin/users/${retailer.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: newStatus }),
    });

    if (res.success) {
      setRetailers((prev) =>
        prev.map((r) => (r.id === retailer.id ? { ...r, isActive: newStatus } : r))
      );
      setSuccessMessage(
        newStatus
          ? `Retailer '${retailer.name}' account approved and activated successfully.`
          : `Retailer '${retailer.name}' account suspended. Store access has been revoked.`
      );
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
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-400" />
              <span>Dark Store Retailers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
                className="w-64 pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <button
              onClick={() => fetchRetailers(search)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Retailers Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Retailer Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Managed Dark Store</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading retailers...
                    </td>
                  </tr>
                ) : retailers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No retailers found.
                    </td>
                  </tr>
                ) : (
                  retailers.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {r.name.slice(0, 1)}
                        </div>
                        <span>{r.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-200">{r.phoneNumber}</div>
                        <div className="text-[10px] text-slate-400">{r.email || "—"}</div>
                      </td>
                      <td className="py-3 px-4">
                        {r.managedStore ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-blue-400">{r.managedStore.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({r.managedStore.city})</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {r.isActive ? "APPROVED & ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
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
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            r.isActive
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          } disabled:opacity-50`}
                        >
                          {updatingId === r.id ? (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Updating...</span>
                            </span>
                          ) : r.isActive ? (
                            "Suspend"
                          ) : (
                            "Approve"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Safeguard Confirmation Modal */}
        {confirmModal.isOpen && confirmModal.retailer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmModal.action === "suspend"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {confirmModal.action === "suspend" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {confirmModal.action === "suspend" ? "Suspend Retailer Account?" : "Approve Retailer Account?"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {confirmModal.action === "suspend"
                      ? `Are you sure you want to suspend '${confirmModal.retailer.name}'?`
                      : `Approve and activate retailer account for '${confirmModal.retailer.name}'?`}
                  </p>
                </div>
              </div>

              {confirmModal.action === "suspend" && confirmModal.retailer.managedStore && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> This retailer is currently managing{" "}
                    <strong>{confirmModal.retailer.managedStore.name}</strong>. Suspending this account will prevent
                    them from processing incoming grocery orders.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, retailer: null, action: "suspend" })}
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#504932] hover:bg-[#E8DFC9] border-2 border-[#C8BEA7] cursor-pointer shadow-xs"
                >
                  <span style={{ color: "#504932" }} className="font-bold">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                    confirmModal.action === "suspend"
                      ? "bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                  }`}
                >
                  {confirmModal.action === "suspend" ? "Confirm Suspension" : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
