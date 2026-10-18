"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  Building2,
  MapPin,
  RefreshCw,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Radio,
  Phone,
  Store,
} from "lucide-react";

interface DarkStore {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  isActive: boolean;
  manager?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
}

interface ManagerCandidate {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
}

export default function StoresPage() {
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State for Manager Assignment
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    store: DarkStore | null;
    selectedManagerId: string;
    isLoadingManagers: boolean;
    isSaving: boolean;
    managers: ManagerCandidate[];
  }>({
    isOpen: false,
    store: null,
    selectedManagerId: "",
    isLoadingManagers: false,
    isSaving: false,
    managers: [],
  });

  const fetchStores = async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient<{ stores: DarkStore[] }>("/api/admin/stores");
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
      selectedManagerId: store.manager?.id || "",
      isLoadingManagers: true,
      isSaving: false,
      managers: [],
    });

    const res = await apiClient<{ users: ManagerCandidate[] }>(
      "/api/admin/users?role=RETAILER&limit=100"
    );

    if (res.success && res.data) {
      setAssignModal((prev) => ({
        ...prev,
        isLoadingManagers: false,
        managers: res.data!.users,
      }));
    } else {
      setAssignModal((prev) => ({
        ...prev,
        isLoadingManagers: false,
      }));
      setError("Failed to load retailer list for manager assignment.");
    }
  };

  const handleSaveManager = async () => {
    if (!assignModal.store) return;

    setAssignModal((prev) => ({ ...prev, isSaving: true }));

    const res = await apiClient<{ store: DarkStore }>(
      `/api/admin/stores/${assignModal.store.id}/manager`,
      {
        method: "PATCH",
        body: JSON.stringify({
          managerId: assignModal.selectedManagerId || null,
        }),
      }
    );

    if (res.success && res.data) {
      setSuccessMessage(
        assignModal.selectedManagerId
          ? `Manager assigned to '${assignModal.store.name}' successfully.`
          : `Manager unassigned from '${assignModal.store.name}'.`
      );
      setStores((prev) =>
        prev.map((s) => (s.id === assignModal.store!.id ? res.data!.store : s))
      );
      setAssignModal((prev) => ({ ...prev, isOpen: false }));
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setError(res.message || "Failed to update store manager");
    }

    setAssignModal((prev) => ({ ...prev, isSaving: false }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#B34E22]" />
              <span>Dark Stores & Micro-Fulfillment Hubs</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Active dark stores, geographic service radius, and assigned store managers
            </p>
          </div>

          <button
            onClick={fetchStores}
            style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF6ED] text-[#504932] text-xs font-bold rounded-xl border border-[#E8E2D5] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            <span style={{ color: "#504932" }} className="font-bold">Refresh Stores</span>
          </button>
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

        {/* Dark Stores Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-[#7A7056]">
              <RefreshCw className="w-6 h-6 text-[#B34E22] animate-spin mx-auto mb-2" />
              <p className="font-semibold text-xs">Loading dark store hubs...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#7A7056] bg-white border border-[#E8E2D5] rounded-3xl p-8">
              <Building2 className="w-10 h-10 text-[#9C937E] mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-sm text-[#504932]">No dark stores found.</h3>
              <p className="text-xs text-[#9C937E] mt-1">Dark stores registered in the database will appear here.</p>
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="bg-white border border-[#E8E2D5] rounded-3xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] text-[#B34E22] border border-[#E8E2D5] flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-[#B34E22]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#504932]">{store.name}</h3>
                        <p className="text-[11px] text-[#7A7056] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#B34E22]" />
                          <span>
                            {store.city}, {store.postalCode}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        store.isActive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}
                    >
                      {store.isActive ? "OPERATIONAL" : "CLOSED"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF6ED] border border-[#E8E2D5] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[#7A7056]">
                      <span>Address:</span>
                      <span className="font-semibold text-[#504932] truncate max-w-[180px]">{store.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#7A7056]">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-[#6A6332]" />
                        <span>Delivery Radius:</span>
                      </span>
                      <span className="font-bold text-[#6A6332]">{store.deliveryRadiusKm} km</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D5]">
                      <span className="flex items-center gap-1 text-[#7A7056]">
                        <User className="w-3 h-3 text-[#B34E22]" />
                        <span>Assigned Manager:</span>
                      </span>
                      {store.manager ? (
                        <div className="text-right">
                          <span className="font-bold text-[#B34E22] block">{store.manager.name}</span>
                          <span className="text-[10px] text-[#7A7056] font-mono flex items-center justify-end gap-1">
                            <Phone className="w-2.5 h-2.5 text-[#9C937E]" />
                            {store.manager.phoneNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                          No Manager Assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between">
                  <span className="text-[10px] text-[#9C937E] font-mono">
                    ID: {store.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => openAssignModal(store)}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#B34E22] hover:bg-[#8F3E1A] text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-white" />
                    <span style={{ color: "#ffffff" }} className="font-bold text-white">Change Manager</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manager Assignment Modal */}
        {assignModal.isOpen && assignModal.store && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-base font-bold text-[#504932]">Assign Store Manager</h3>
                    <p className="text-xs text-[#7A7056]">{assignModal.store.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssignModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{ color: "#504932" }}
                  className="p-1.5 rounded-lg text-[#7A7056] hover:text-[#504932] hover:bg-[#FAF6ED] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#504932] block">
                  Select Retailer Account:
                </label>

                {assignModal.isLoadingManagers ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#7A7056] gap-2">
                    <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin" />
                    <span className="text-xs">Fetching registered retailers...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <label
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        assignModal.selectedManagerId === ""
                          ? "bg-[#FFF7ED] border-[#B34E22]"
                          : "bg-white border-[#E8E2D5] hover:bg-[#FAF6ED]"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#504932]">None (Unassigned)</span>
                        <p className="text-[10px] text-[#7A7056]">Store has no assigned manager</p>
                      </div>
                      <input
                        type="radio"
                        name="storeManager"
                        checked={assignModal.selectedManagerId === ""}
                        onChange={() =>
                          setAssignModal((prev) => ({ ...prev, selectedManagerId: "" }))
                        }
                        className="text-[#B34E22] focus:ring-0"
                      />
                    </label>

                    {assignModal.managers.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          assignModal.selectedManagerId === m.id
                            ? "bg-[#FFF7ED] border-[#B34E22]"
                            : "bg-white border-[#E8E2D5] hover:bg-[#FAF6ED]"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#504932]">{m.name}</div>
                          <div className="text-[10px] text-[#7A7056] flex items-center gap-2">
                            <span>{m.phoneNumber}</span>
                            {m.email && <span>• {m.email}</span>}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="storeManager"
                          checked={assignModal.selectedManagerId === m.id}
                          onChange={() =>
                            setAssignModal((prev) => ({ ...prev, selectedManagerId: m.id }))
                          }
                          className="text-[#B34E22] focus:ring-0"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  disabled={assignModal.isSaving}
                  onClick={() => setAssignModal((prev) => ({ ...prev, isOpen: false }))}
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-[#504932] hover:bg-[#E8DFC9] border-2 border-[#C8BEA7] cursor-pointer shadow-xs"
                >
                  <span style={{ color: "#504932" }} className="font-extrabold">Cancel</span>
                </button>
                <button
                  type="button"
                  disabled={assignModal.isSaving || assignModal.isLoadingManagers}
                  onClick={handleSaveManager}
                  style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#B34E22] hover:bg-[#8F3E1A] text-white shadow-md shadow-[#B34E22]/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {assignModal.isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span style={{ color: "#ffffff" }} className="font-extrabold">Saving...</span>
                    </>
                  ) : (
                    <span style={{ color: "#ffffff" }} className="font-extrabold">Save Assignment</span>
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
