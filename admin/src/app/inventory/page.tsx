"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  Boxes,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Store as StoreIcon,
} from "lucide-react";

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

interface ProductOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number | string;
  imageUrl?: string | null;
  isActive: boolean;
}

interface StoreOption {
  id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("ALL");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [threshold, setThreshold] = useState<number>(10);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<string>("10");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available Stores & Products for Modal Pickers
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Add Stock Modal state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    storeId: "",
    productId: "",
    stockQuantity: "25",
    price: "",
    isAvailable: true,
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Update Stock Modal state
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<InventoryRecord | null>(null);
  const [updateForm, setUpdateForm] = useState({
    stockQuantity: "",
    price: "",
    isAvailable: true,
  });
  const [updateFormErrors, setUpdateFormErrors] = useState<Record<string, string>>({});
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  // Delete Stock Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (lowStockFilter) query.append("lowStock", "true");
    if (threshold !== 10) query.append("threshold", String(threshold));
    if (selectedStoreFilter !== "ALL") query.append("storeId", selectedStoreFilter);

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

  const fetchStoresAndProducts = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        apiClient<{ stores: StoreOption[] }>("/api/stores"),
        apiClient<{ products: ProductOption[] }>("/api/products?limit=100"),
      ]);

      if (storesRes.success && storesRes.data) {
        setStores(storesRes.data.stores);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data.products);
      }
    } catch (err) {
      console.error("Failed to fetch stores or products", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter, threshold, selectedStoreFilter]);

  useEffect(() => {
    fetchStoresAndProducts();
  }, []);

  // Filter items in memory by search query
  const filteredItems = items.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.productName.toLowerCase().includes(q) ||
      inv.productCategory.toLowerCase().includes(q) ||
      inv.storeName.toLowerCase().includes(q) ||
      inv.storeCity.toLowerCase().includes(q)
    );
  });

  // Open Add Stock Modal
  const openAddStockModal = () => {
    const defaultStore = stores[0]?.id || "";
    const defaultProduct = products[0];
    setAddForm({
      storeId: defaultStore,
      productId: defaultProduct?.id || "",
      stockQuantity: "25",
      price: defaultProduct ? String(defaultProduct.basePrice) : "50",
      isAvailable: true,
    });
    setAddFormErrors({});
    setIsAddStockOpen(true);
  };

  const handleProductSelectChange = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    setAddForm((prev) => ({
      ...prev,
      productId,
      price: p ? String(p.basePrice) : prev.price,
    }));
  };

  const handleSaveAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!addForm.storeId) errs.storeId = "Store is required";
    if (!addForm.productId) errs.productId = "Product is required";

    const qty = parseInt(addForm.stockQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      errs.stockQuantity = "Quantity must be an integer 0 or greater";
    }

    const pr = parseFloat(addForm.price);
    if (isNaN(pr) || pr <= 0) {
      errs.price = "Selling price must be greater than 0";
    }

    if (Object.keys(errs).length > 0) {
      setAddFormErrors(errs);
      return;
    }

    setIsSavingAdd(true);
    setAddFormErrors({});

    const res = await apiClient(`/api/stores/${addForm.storeId}/inventory`, {
      method: "POST",
      body: JSON.stringify({
        productId: addForm.productId,
        stockQuantity: qty,
        price: pr,
        isAvailable: addForm.isAvailable,
      }),
    });

    if (res.success) {
      setSuccessMessage("Stock added/updated successfully for retailer store!");
      setIsAddStockOpen(false);
      fetchInventory();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setAddFormErrors({ general: res.message || "Failed to add stock" });
    }
    setIsSavingAdd(false);
  };

  // Open Update Stock Modal
  const openUpdateStockModal = (item: InventoryRecord) => {
    setUpdatingItem(item);
    setUpdateForm({
      stockQuantity: String(item.stockQuantity),
      price: String(item.storePrice),
      isAvailable: item.isAvailable,
    });
    setUpdateFormErrors({});
    setIsUpdateStockOpen(true);
  };

  const handleSaveUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingItem) return;

    const errs: Record<string, string> = {};
    const qty = parseInt(updateForm.stockQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      errs.stockQuantity = "Stock quantity cannot be negative";
    }

    const pr = parseFloat(updateForm.price);
    if (isNaN(pr) || pr <= 0) {
      errs.price = "Price must be greater than 0";
    }

    if (Object.keys(errs).length > 0) {
      setUpdateFormErrors(errs);
      return;
    }

    setIsSavingUpdate(true);
    setUpdateFormErrors({});

    const res = await apiClient(
      `/api/stores/${updatingItem.storeId}/inventory/${updatingItem.productId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          stockQuantity: qty,
          price: pr,
          isAvailable: updateForm.isAvailable,
        }),
      }
    );

    if (res.success) {
      setSuccessMessage(
        `Updated stock for ${updatingItem.productName} in ${updatingItem.storeName}`
      );
      setIsUpdateStockOpen(false);
      setUpdatingItem(null);
      fetchInventory();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setUpdateFormErrors({ general: res.message || "Failed to update stock" });
    }
    setIsSavingUpdate(false);
  };

  // Quick Toggle Availability
  const handleToggleAvailability = async (item: InventoryRecord) => {
    const newStatus = !item.isAvailable;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i))
    );

    const res = await apiClient(
      `/api/stores/${item.storeId}/inventory/${item.productId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: newStatus }),
      }
    );

    if (!res.success) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i))
      );
      setError(res.message || "Failed to toggle availability");
    } else {
      setSuccessMessage(
        `${item.productName} is now ${newStatus ? "AVAILABLE" : "DISABLED"} in ${item.storeName}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Delete Stock
  const openDeleteStockModal = (item: InventoryRecord) => {
    setItemToDelete(item);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStock = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await apiClient(
      `/api/stores/${itemToDelete.storeId}/inventory/${itemToDelete.productId}`,
      {
        method: "DELETE",
      }
    );

    if (res.success) {
      setSuccessMessage(
        `Removed ${itemToDelete.productName} from ${itemToDelete.storeName} inventory`
      );
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInventory();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setDeleteError(res.message || "Failed to delete inventory record");
    }
    setIsDeleting(false);
  };

  // Apply Low Stock Threshold
  const applyThreshold = () => {
    const num = parseInt(tempThreshold, 10);
    if (!isNaN(num) && num >= 0) {
      setThreshold(num);
      setIsThresholdModalOpen(false);
      setSuccessMessage(`Low stock threshold updated to ≤ ${num} units`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#B34E22]" />
              <span>Multi-Store Stock & Inventory Management</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Atomic inventory allocation, real-time threshold monitoring, localized pricing, and store availability
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or store..."
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-52 pl-8 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-2.5 top-3" />
            </div>

            {/* Store Filter Dropdown */}
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="px-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs font-bold text-[#504932] focus:outline-none focus:border-[#B34E22] shadow-xs cursor-pointer"
            >
              <option value="ALL">All Retailer Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>

            {/* Set Low Stock Threshold Button */}
            <button
              onClick={() => {
                setTempThreshold(String(threshold));
                setIsThresholdModalOpen(true);
              }}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="px-3 py-2 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Configure replenishment alert threshold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B34E22]" />
              <span>Threshold: ≤{threshold}</span>
            </button>

            {/* Low Stock Toggle Filter */}
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              style={{
                color: lowStockFilter ? "#ffffff" : "#504932",
                backgroundColor: lowStockFilter ? "#B34E22" : "#FFFFFF",
                borderColor: lowStockFilter ? "#B34E22" : "#E8E2D5",
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shadow-xs cursor-pointer ${
                lowStockFilter ? "bg-[#B34E22] text-white shadow-sm" : "bg-white hover:bg-[#FAF6ED]"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? "text-white" : "text-[#B34E22]"}`} />
              <span className="font-extrabold">
                {lowStockFilter ? `Low Stock (≤${threshold})` : "Filter Low Stock"}
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchInventory}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-colors cursor-pointer"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* + Add Stock Button */}
            <button
              onClick={openAddStockModal}
              style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span style={{ color: "#ffffff" }} className="text-white font-bold">+ Add Stock</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Retailer / Store</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Stock Indicator</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading multi-store inventory...</span>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7A7056]">
                      <Package className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No inventory records found.</p>
                      <p className="text-xs text-[#9C937E] mt-1">
                        {lowStockFilter
                          ? `No inventory items are currently at or below the threshold (≤${threshold}).`
                          : "No stock records match your filters. Click '+ Add Stock' to allocate inventory to a store."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((inv) => {
                    const isDepleted = inv.stockQuantity === 0;
                    const isLow = inv.stockQuantity <= threshold;

                    return (
                      <tr key={inv.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                        {/* Product Name */}
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
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#7A7056] bg-[#FAF6ED] px-1.5 py-0.5 rounded border border-[#E8E2D5]">
                                {inv.productCategory}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Store / Retailer */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#504932]">{inv.storeName}</div>
                          <div className="text-[11px] text-[#7A7056]">{inv.storeCity}</div>
                        </td>

                        {/* Available Quantity */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                              isDepleted
                                ? "bg-red-50 text-red-800 border-red-300 font-black"
                                : isLow
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            {inv.stockQuantity}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-4 font-semibold text-[#504932]">
                          {inv.productUnit}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-[#B34E22] text-sm">
                            ₹{Number(inv.storePrice).toFixed(2)}
                          </div>
                          {Number(inv.basePrice) !== Number(inv.storePrice) && (
                            <div className="text-[10px] text-[#7A7056]">
                              Catalog: ₹{Number(inv.basePrice).toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Stock Indicator */}
                        <td className="py-3 px-4">
                          {isDepleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              OUT OF STOCK
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              LOW (≤{threshold})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              IN STOCK
                            </span>
                          )}
                        </td>

                        {/* Availability Status & Quick Toggle */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                inv.isAvailable
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                              }`}
                            >
                              {inv.isAvailable ? "ACTIVE" : "DISABLED"}
                            </span>
                            <button
                              onClick={() => handleToggleAvailability(inv)}
                              style={{ color: inv.isAvailable ? "#B34E22" : "#9C937E" }}
                              className="p-1 hover:bg-[#FAF6ED] rounded transition-colors cursor-pointer"
                              title={inv.isAvailable ? "Disable this stock item" : "Enable this stock item"}
                            >
                              {inv.isAvailable ? (
                                <ToggleRight className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openUpdateStockModal(inv)}
                              style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#E8E2D5" }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FAF6ED] hover:bg-[#EBD3AA] text-[#504932] border border-[#E8E2D5] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Update Stock"
                            >
                              <Pencil className="w-3 h-3 text-[#504932]" />
                              <span>Update</span>
                            </button>

                            <button
                              onClick={() => openDeleteStockModal(inv)}
                              style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                              className="p-1.5 rounded-lg bg-[#FFF7ED] hover:bg-red-100 text-[#B34E22] border border-[#FDBA74] transition-all cursor-pointer"
                              title="Remove Stock from Store"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD STOCK MODAL */}
        {isAddStockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">Add Stock Allocation</h3>
                    <p className="text-[11px] text-[#7A7056]">Associate catalog product to authorized retailer store</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddStockOpen(false)}
                  style={{ color: "#504932" }}
                  className="p-1.5 rounded-lg text-[#7A7056] hover:text-[#504932] hover:bg-[#EBD3AA]/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddStock} className="p-6 space-y-4">
                {addFormErrors.general && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addFormErrors.general}</span>
                  </div>
                )}

                {/* Store Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">
                    Select Store / Retailer <span className="text-[#B34E22]">*</span>
                  </label>
                  <select
                    value={addForm.storeId}
                    onChange={(e) => setAddForm({ ...addForm, storeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22] cursor-pointer"
                  >
                    <option value="">-- Choose Store --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.city}
                      </option>
                    ))}
                  </select>
                  {addFormErrors.storeId && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{addFormErrors.storeId}</p>
                  )}
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">
                    Select Catalog Product <span className="text-[#B34E22]">*</span>
                  </label>
                  <select
                    value={addForm.productId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22] cursor-pointer"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit}) — Base ₹{Number(p.basePrice).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {addFormErrors.productId && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{addFormErrors.productId}</p>
                  )}
                </div>

                {/* Stock Quantity & Selling Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Stock Quantity <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={addForm.stockQuantity}
                      onChange={(e) => setAddForm({ ...addForm, stockQuantity: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] text-[#504932] focus:outline-none focus:border-[#B34E22]"
                    />
                    {addFormErrors.stockQuantity && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{addFormErrors.stockQuantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Store Selling Price (₹) <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={addForm.price}
                      onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                      placeholder="e.g. 45.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] text-[#504932] focus:outline-none focus:border-[#B34E22]"
                    />
                    {addFormErrors.price && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{addFormErrors.price}</p>
                    )}
                  </div>
                </div>

                {/* Availability Checkbox */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.isAvailable}
                    onChange={(e) => setAddForm({ ...addForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded border-[#E8E2D5] text-[#B34E22] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-[#504932]">
                    Available for customer checkout immediately
                  </span>
                </label>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddStockOpen(false)}
                    style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                    className="px-4 py-2 text-xs font-bold border border-[#E8E2D5] rounded-xl hover:bg-[#FAF6ED] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAdd}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#B34E22] hover:bg-[#8F3E1A] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingAdd ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Stock Record</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* UPDATE STOCK MODAL */}
        {isUpdateStockOpen && updatingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">Update Store Stock</h3>
                    <p className="text-[11px] text-[#7A7056]">
                      {updatingItem.productName} in {updatingItem.storeName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUpdateStockOpen(false)}
                  style={{ color: "#504932" }}
                  className="p-1.5 rounded-lg text-[#7A7056] hover:text-[#504932] hover:bg-[#EBD3AA]/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUpdateStock} className="p-6 space-y-4">
                {updateFormErrors.general && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{updateFormErrors.general}</span>
                  </div>
                )}

                <div className="p-3 bg-[#FAF6ED] rounded-xl border border-[#E8E2D5] space-y-1">
                  <div className="text-xs font-bold text-[#504932]">{updatingItem.productName}</div>
                  <div className="text-[11px] text-[#7A7056]">
                    Store: <span className="font-semibold text-[#504932]">{updatingItem.storeName}</span> ({updatingItem.storeCity})
                  </div>
                  <div className="text-[11px] text-[#7A7056]">
                    Packaging Unit: <span className="font-semibold text-[#504932]">{updatingItem.productUnit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Available Quantity <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={updateForm.stockQuantity}
                      onChange={(e) => setUpdateForm({ ...updateForm, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] text-[#504932] focus:outline-none focus:border-[#B34E22]"
                    />
                    {updateFormErrors.stockQuantity && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{updateFormErrors.stockQuantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Selling Price (₹) <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={updateForm.price}
                      onChange={(e) => setUpdateForm({ ...updateForm, price: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] text-[#504932] focus:outline-none focus:border-[#B34E22]"
                    />
                    {updateFormErrors.price && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{updateFormErrors.price}</p>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateForm.isAvailable}
                    onChange={(e) => setUpdateForm({ ...updateForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded border-[#E8E2D5] text-[#B34E22] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-[#504932]">
                    Available for customer purchase
                  </span>
                </label>

                <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUpdateStockOpen(false)}
                    style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                    className="px-4 py-2 text-xs font-bold border border-[#E8E2D5] rounded-xl hover:bg-[#FAF6ED] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUpdate}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#B34E22] hover:bg-[#8F3E1A] rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingUpdate ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SET THRESHOLD MODAL */}
        {isThresholdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#B34E22]" />
                  <h3 className="text-sm font-bold text-[#504932]">Set Low Stock Threshold</h3>
                </div>
                <button
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="p-1 rounded text-[#7A7056] hover:text-[#504932]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-[#7A7056]">
                  Items with available quantity at or below this threshold trigger low-stock alerts and replenishment warnings.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-[#E8E2D5] text-[#504932] focus:outline-none focus:border-[#B34E22]"
                  />
                  <span className="text-xs font-semibold text-[#7A7056] shrink-0">units</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[5, 10, 15, 20, 25, 50].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTempThreshold(String(t))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                        tempThreshold === String(t)
                          ? "bg-[#B34E22] text-white border-[#B34E22]"
                          : "bg-[#FAF6ED] text-[#504932] border-[#E8E2D5] hover:bg-[#EBD3AA]"
                      }`}
                    >
                      ≤ {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold border border-[#E8E2D5] rounded-xl text-[#504932] hover:bg-[#FAF6ED]"
                >
                  Cancel
                </button>
                <button
                  onClick={applyThreshold}
                  style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#B34E22] hover:bg-[#8F3E1A] rounded-xl shadow-sm"
                >
                  Apply Threshold
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteModalOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-3 mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-center text-[#504932]">Remove Stock Item?</h3>
              <p className="text-xs text-center text-[#7A7056] mt-1">
                Are you sure you want to remove <span className="font-bold text-[#504932]">{itemToDelete.productName}</span> from <span className="font-bold text-[#504932]">{itemToDelete.storeName}</span> inventory?
              </p>

              {deleteError && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {deleteError}
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-[#E8E2D5] rounded-xl text-[#504932] hover:bg-[#FAF6ED] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStock}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Removing..." : "Confirm Remove"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
