"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  ExternalLink,
  Boxes,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  unit: string;
  basePrice: string | number;
  imageUrl: string | null;
  dietaryType: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  unit: string;
  basePrice: string;
  imageUrl: string;
  dietaryType: string;
  isActive: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  category: "Vegetables",
  unit: "1kg",
  basePrice: "",
  imageUrl: "",
  dietaryType: "VEG",
  isActive: true,
};

const CATEGORIES = [
  "ALL",
  "Vegetables",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Grains",
  "Snacks",
  "Fruits",
  "Spices",
  "Beverages",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal state (Create & Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: "100" });
    if (selectedCategory !== "ALL") query.append("category", selectedCategory);
    if (search.trim()) query.append("search", search.trim());

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

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
    setError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      category: p.category,
      unit: p.unit,
      basePrice: String(p.basePrice),
      imageUrl: p.imageUrl || "",
      dietaryType: p.dietaryType || "VEG",
      isActive: p.isActive,
    });
    setFormErrors({});
    setError(null);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const openDeleteModal = (p: Product) => {
    setProductToDelete(p);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
    setDeleteError(null);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Product name must be at least 2 characters";
    }
    if (!formData.category.trim()) {
      errs.category = "Category is required";
    }
    if (!formData.unit.trim()) {
      errs.unit = "Unit is required (e.g. 1kg, 500g, 1 piece)";
    }
    const priceNum = parseFloat(formData.basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      errs.basePrice = "Base price must be greater than 0";
    }
    if (formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl.trim());
      } catch {
        errs.imageUrl = "Please enter a valid URL (e.g. https://...)";
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFormErrors({});

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category.trim(),
      unit: formData.unit.trim(),
      basePrice: parseFloat(formData.basePrice),
      imageUrl: formData.imageUrl.trim() || undefined,
      dietaryType: formData.dietaryType,
      isActive: formData.isActive,
    };

    let res;
    if (editingProduct) {
      res = await apiClient<{ product: Product }>(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiClient<{ product: Product }>("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    if (res.success) {
      setSuccessMessage(
        editingProduct ? "Product updated successfully!" : "Product created successfully!"
      );
      closeFormModal();
      fetchProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      if (res.errors && res.errors.length > 0) {
        const backendErrs: Record<string, string> = {};
        res.errors.forEach((e) => {
          backendErrs[e.field] = e.message;
        });
        setFormErrors(backendErrs);
      } else {
        setFormErrors({ general: res.message || "Failed to save product" });
      }
    }
    setIsSaving(false);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await apiClient(`/api/products/${productToDelete.id}`, {
      method: "DELETE",
    });

    if (res.success) {
      setSuccessMessage(res.message || "Product deleted successfully!");
      closeDeleteModal();
      fetchProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setDeleteError(res.message || "Failed to delete product");
    }
    setIsDeleting(false);
  };

  const getDietaryBadge = (type: string) => {
    switch (type) {
      case "VEG":
        return "border-[#6A6332] text-[#6A6332] bg-[#6A6332]/10 font-bold";
      case "NON_VEG":
        return "border-red-500 text-red-600 bg-red-50 font-bold";
      case "CONTAINS_EGG":
        return "border-[#B34E22] text-[#B34E22] bg-[#B34E22]/10 font-bold";
      case "VEGAN":
        return "border-emerald-600 text-emerald-700 bg-emerald-50 font-bold";
      default:
        return "border-[#E8E2D5] text-[#7A7056] bg-[#FAF6ED]";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-[#B34E22]" />
              <span>Products Master Catalog</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Create, edit, and organize grocery catalog items, packaging units, and dietary tags
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
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-56 pl-9 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
            </div>

            <button
              onClick={fetchProducts}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-all cursor-pointer"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/inventory"
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] text-xs font-bold rounded-xl border border-[#E8E2D5] shadow-xs transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-[#B34E22]" />
              <span className="font-bold">Manage Stock</span>
            </Link>

            <button
              onClick={openCreateModal}
              style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span style={{ color: "#ffffff" }} className="text-white font-bold">+ Add Product</span>
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

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  color: isActive ? "#ffffff" : "#504932",
                  backgroundColor: isActive ? "#B34E22" : "#FFFFFF",
                  borderColor: isActive ? "#B34E22" : "#E8E2D5",
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? "bg-[#B34E22] text-white shadow-sm"
                    : "bg-white text-[#504932] hover:bg-[#FAF6ED]"
                }`}
              >
                <span style={{ color: isActive ? "#ffffff" : "#504932" }} className="font-extrabold">
                  {cat}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Table */}
        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[11px] border-b border-[#E8E2D5] font-bold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit / Package</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Dietary Type</th>
                  <th className="py-3 px-4">Catalog Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <RefreshCw className="w-5 h-5 text-[#B34E22] animate-spin mx-auto mb-2" />
                      <span>Loading products master catalog...</span>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7A7056]">
                      <Package className="w-8 h-8 text-[#9C937E] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm">No products found</p>
                      <p className="text-xs text-[#9C937E] mt-1">
                        Try adjusting your search or category filter, or add a new product.
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF6ED] overflow-hidden shrink-0 border border-[#E8E2D5] flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-[#9C937E]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#504932] text-xs">{p.name}</div>
                            <div className="text-[10px] text-[#7A7056] font-mono">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#504932] bg-[#FAF6ED] px-2.5 py-0.5 rounded-md border border-[#E8E2D5]">
                          <Tag className="w-3 h-3 text-[#B34E22]" />
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#504932] font-semibold">{p.unit}</td>
                      <td className="py-3 px-4 font-extrabold text-[#B34E22] text-sm">
                        ₹{Number(p.basePrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getDietaryBadge(
                            p.dietaryType
                          )}`}
                        >
                          {p.dietaryType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            p.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {p.isActive ? "PUBLISHED" : "UNLISTED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#E8E2D5" }}
                            className="p-1.5 rounded-lg bg-[#FAF6ED] hover:bg-[#EBD3AA] text-[#504932] border border-[#E8E2D5] transition-all cursor-pointer"
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#504932]" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(p)}
                            style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                            className="p-1.5 rounded-lg bg-[#FFF7ED] hover:bg-red-100 text-[#B34E22] border border-[#FDBA74] transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT PRODUCT MODAL */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">
                      {editingProduct ? "Edit Catalog Product" : "Add New Catalog Product"}
                    </h3>
                    <p className="text-[11px] text-[#7A7056]">
                      {editingProduct
                        ? `Updating #${editingProduct.slug}`
                        : "Define item details, category, unit, base price, and dietary tags"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeFormModal}
                  style={{ color: "#504932" }}
                  className="p-1.5 rounded-lg text-[#7A7056] hover:text-[#504932] hover:bg-[#EBD3AA]/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {formErrors.general && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.general}</span>
                  </div>
                )}

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">
                    Product Name <span className="text-[#B34E22]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fresh Red Onions"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.name}</p>
                  )}
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Category <span className="text-[#B34E22]">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22] bg-white cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Unit / Package <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g. 1kg, 500g, 1 piece, packet"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["1kg", "500g", "250g", "1 litre", "500ml", "1 piece", "1 packet"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFormData({ ...formData, unit: u })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            formData.unit === u
                              ? "bg-[#B34E22] text-white border-[#B34E22]"
                              : "bg-[#FAF6ED] text-[#7A7056] border-[#E8E2D5] hover:bg-[#EBD3AA]/50"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    {formErrors.unit && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.unit}</p>
                    )}
                  </div>
                </div>

                {/* Base Price & Dietary Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Base Price (₹) <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      placeholder="e.g. 45.00"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    {formErrors.basePrice && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.basePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Dietary Type</label>
                    <select
                      value={formData.dietaryType}
                      onChange={(e) => setFormData({ ...formData, dietaryType: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22] bg-white cursor-pointer"
                    >
                      <option value="VEG">VEG</option>
                      <option value="NON_VEG">NON_VEG</option>
                      <option value="CONTAINS_EGG">CONTAINS_EGG</option>
                      <option value="VEGAN">VEGAN</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                  />
                  {formErrors.imageUrl && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.imageUrl}</p>
                  )}
                  {formData.imageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-[#FAF6ED] border border-[#E8E2D5] overflow-hidden shrink-0">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'>Error</text></svg>";
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-[#7A7056]">Image preview</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional item highlights, origin, or freshness guarantees..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                  />
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#E8E2D5] text-[#B34E22] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-[#504932]">
                    Publish item to customer catalog (Active)
                  </span>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                    className="px-5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border-2 border-[#C8BEA7] transition-all cursor-pointer shadow-xs"
                  >
                    <span style={{ color: "#504932" }} className="font-extrabold text-[#504932]">Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-[#B34E22]/25 transition-all cursor-pointer"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span style={{ color: "#ffffff" }} className="text-white font-extrabold">
                      {isSaving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE PRODUCT CONFIRMATION MODAL */}
        {isDeleteModalOpen && productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#FFF7ED] border-b border-[#FDBA74] flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900">Delete Product</h3>
                  <p className="text-[11px] text-[#7A7056]">This action modifies the master catalog</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-[#504932]">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#B34E22]">{productToDelete.name}</strong>?
                </p>
                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8E2D5] text-[11px] text-[#7A7056] space-y-1">
                  <p>
                    <strong>Note:</strong> If this product has historical orders, it will be automatically
                    unlisted (soft-deleted) to protect past customer receipts and accounting records.
                  </p>
                </div>

                {deleteError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                    className="px-5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border-2 border-[#C8BEA7] transition-all cursor-pointer shadow-xs"
                  >
                    <span style={{ color: "#504932" }} className="font-extrabold text-[#504932]">Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    disabled={isDeleting}
                    style={{ color: "#ffffff", backgroundColor: "#DC2626" }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
                  >
                    {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span style={{ color: "#ffffff" }} className="text-white font-extrabold">
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
