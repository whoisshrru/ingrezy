"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  Building2,
  MapPin,
  RefreshCw,
  AlertCircle,
  Radio,
  UserCheck,
  UserX,
  UserPlus,
  CheckCircle2,
  X,
  Phone,
  AlertTriangle,
} from "lucide-react";

interface DarkStore {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  serviceRadiusKm: number;
  isActive: boolean;
  manager?: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
  } | null;
}

interface EligibleManager {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  isCurrentManager: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Assign Manager Modal State
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    store: DarkStore | null;
    eligibleManagers: EligibleManager[];
    selectedManagerId: string;
    isLoadingManagers: boolean;
    isSaving: boolean;
    modalError: string | null;
  }>({
    isOpen: false,
    store: null,
    eligibleManagers: [],
    selectedManagerId: "",
    isLoadingManagers: false,
    isSaving: false,
    modalError: null,
  });

  const fetchStores = async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient<{ stores: DarkStore[] }>("/api/stores");
    if (res.success && res.data) {
      setStores(res.data.stores);
    } else {
      setError(res.message || "Failed to load dark stores");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openAssignModal = async (store: DarkStore) => {
    setAssignModal({
      isOpen: true,
      store,
      eligibleManagers: [],
      selectedManagerId: store.manager?.id || "",
      isLoadingManagers: true,
      isSaving: false,
      modalError: null,
    });

    const res = await apiClient<{ eligibleManagers: EligibleManager[] }>(
      `/api/admin/stores/${store.id}/eligible-managers`
    );

    if (res.success && res.data) {
      setAssignModal((prev) => ({
        ...prev,
        eligibleManagers: res.data!.eligibleManagers,
        isLoadingManagers: false,
      }));
    } else {
      setAssignModal((prev) => ({
        ...prev,
        isLoadingManagers: false,
        modalError: res.message || "Failed to load eligible store managers",
      }));
    }
  };

  const handleSaveManager = async () => {
    const { store, selectedManagerId } = assignModal;
    if (!store) return;

    setAssignModal((prev) => ({ ...prev, isSaving: true, modalError: null }));
    setError(null);

    const targetManagerId = selectedManagerId.trim() ? selectedManagerId : null;

    const res = await apiClient<{ store: DarkStore }>(`/api/admin/stores/${store.id}/manager`, {
      method: "PATCH",
      body: JSON.stringify({ managerId: targetManagerId }),
    });

    if (res.success && res.data) {
      const updated = res.data.store;
      setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, manager: updated.manager } : s)));
      setSuccessMessage(
        targetManagerId
          ? `Manager '${updated.manager?.name}' successfully assigned to ${store.name}.`
          : `Manager unassigned from ${store.name}. Store is now Unassigned.`
      );
      setAssignModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
    } else {
      setAssignModal((prev) => ({
        ...prev,
        isSaving: false,
        modalError: res.message || "Failed to assign store manager",
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Dark Stores & Micro-Fulfillment Hubs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active dark stores, geographic service radius, and assigned store managers
            </p>
          </div>

          <button
            onClick={fetchStores}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Stores</span>
          </button>
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

        {/* Dark Stores Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              Loading dark stores...
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              No dark stores found.
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{store.name}</h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>
                            {store.city}, {store.postalCode}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        store.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {store.isActive ? "OPERATIONAL" : "CLOSED"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Address:</span>
                      <span className="font-medium text-slate-200 truncate max-w-[180px]">{store.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-400" />
                        <span>Delivery Radius:</span>
                      </span>
                      <span className="font-semibold text-emerald-400">{store.serviceRadiusKm} km</span>
                    </div>

                    {/* Manager Status Block */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Assigned Manager:</span>
                      </span>

                      {store.manager ? (
                        <div className="text-right">
                          <div className="font-bold text-blue-400 text-xs">{store.manager.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{store.manager.phoneNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">ID: {store.id.slice(0, 8)}...</span>
                  <button
                    onClick={() => openAssignModal(store)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{store.manager ? "Change Manager" : "Assign Manager"}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manager Assignment Modal */}
        {assignModal.isOpen && assignModal.store && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <span>Assign Dark Store Manager</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Store: <strong className="text-slate-200">{assignModal.store.name}</strong> ({assignModal.store.city})
                  </p>
                </div>
                <button
                  onClick={() => setAssignModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {assignModal.modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{assignModal.modalError}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Active & Eligible Retailer:
                </label>

                {assignModal.isLoadingManagers ? (
                  <div className="py-6 flex flex-col items-center gap-2 text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Fetching eligible active retailers...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={assignModal.selectedManagerId}
                      onChange={(e) =>
                        setAssignModal((prev) => ({ ...prev, selectedManagerId: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— None (Unassigned Store) —</option>
                      {assignModal.eligibleManagers.map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name} ({mgr.phoneNumber}) {mgr.isCurrentManager ? "• Current Manager" : "• Available"}
                        </option>
                      ))}
                    </select>

                    {assignModal.eligibleManagers.length === 0 && (
                      <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          No other unassigned active retailers found. To assign a new retailer, ensure their account has
                          role RETAILER and is in APPROVED & ACTIVE status.
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Business Rule & Safeguard:</p>
                <p>
                  • Each retailer can manage at most one dark store at a time.
                  <br />
                  • Only active, approved retailer accounts can be assigned. Inactive or suspended accounts are rejected
                  by the backend.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={assignModal.isSaving}
                  onClick={() => setAssignModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignModal.isSaving || assignModal.isLoadingManagers}
                  onClick={handleSaveManager}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {assignModal.isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Assignment...</span>
                    </>
                  ) : (
                    <span>Save Assignment</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
