"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  BookOpen,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
  Search,
  Plus,
  DownloadCloud,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  ExternalLink,
  ChefHat,
  Package,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

interface RecipeIngredient {
  id?: string;
  productId?: string | null;
  ingredientName?: string | null;
  quantity: number;
  unit: string;
  isMandatory: boolean;
  notes?: string | null;
  product?: {
    id: string;
    name: string;
    unit: string;
    basePrice: number | string;
    category?: string;
    imageUrl?: string | null;
  } | null;
}

interface Recipe {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietaryType: string;
  difficulty: string;
  imageUrl: string | null;
  instructions: string;
  isActive: boolean;
  externalId?: string | null;
  source?: string;
  createdAt: string;
  ingredients?: RecipeIngredient[];
  _count?: {
    ingredients: number;
  };
}

interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number | string;
}

interface IngredientRow {
  productId: string;
  quantity: string;
  unit: string;
  isMandatory: boolean;
  notes: string;
}

interface RecipeFormData {
  title: string;
  description: string;
  cuisine: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  servings: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  dietaryType: string;
  imageUrl: string;
  instructions: string;
  isActive: boolean;
  ingredients: IngredientRow[];
}

const initialRecipeFormData: RecipeFormData = {
  title: "",
  description: "",
  cuisine: "Indian",
  prepTimeMinutes: "15",
  cookTimeMinutes: "25",
  servings: "2",
  difficulty: "EASY",
  dietaryType: "VEG",
  imageUrl: "",
  instructions: "",
  isActive: true,
  ingredients: [
    {
      productId: "",
      quantity: "1",
      unit: "piece",
      isMandatory: true,
      notes: "",
    },
  ],
};

const CUISINES = ["ALL", "Indian", "Italian", "Mexican", "Chinese", "American", "International"];

const POPULAR_MEALDB_SUGGESTIONS = [
  { id: "52771", name: "Spicy Arrabiata Penne (Italian)" },
  { id: "52772", name: "Teriyaki Chicken Casserole (Asian)" },
  { id: "52874", name: "Beef and Mustard Pie (British)" },
  { id: "52977", name: "Corba (Turkish Lentil Soup)" },
  { id: "53065", name: "Sushi Rolls (Japanese)" },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drawer / View details state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipeDetails, setIsLoadingRecipeDetails] = useState(false);

  // Form Modal state (Create & Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>(initialRecipeFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // TheMealDB Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [mealDbIdInput, setMealDbIdInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    isAlreadyImported: boolean;
    stats?: { totalIngredients: number; matchedCount: number; unmatchedCount: number };
    message?: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: "50" });
    if (selectedCuisine !== "ALL") query.append("cuisine", selectedCuisine);
    if (search.trim()) query.append("search", search.trim());

    const res = await apiClient<{ recipes: Recipe[] }>(`/api/recipes?${query.toString()}`);
    if (res.success && res.data) {
      setRecipes(res.data.recipes);
    } else {
      setError(res.message || "Failed to load recipes");
    }
    setIsLoading(false);
  };

  const fetchCatalogProducts = async () => {
    const res = await apiClient<{ products: CatalogProduct[] }>("/api/products?limit=100");
    if (res.success && res.data) {
      setCatalogProducts(res.data.products);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchCatalogProducts();
  }, [selectedCuisine]);

  const viewRecipeDetails = async (idOrSlug: string) => {
    setIsLoadingRecipeDetails(true);
    const res = await apiClient<{ recipe: Recipe }>(`/api/recipes/${idOrSlug}`);
    if (res.success && res.data) {
      setSelectedRecipe(res.data.recipe);
    }
    setIsLoadingRecipeDetails(false);
  };

  const closeRecipeDetails = () => {
    setSelectedRecipe(null);
  };

  const openCreateModal = () => {
    setEditingRecipe(null);
    setFormData({
      ...initialRecipeFormData,
      ingredients: [
        {
          productId: catalogProducts[0]?.id || "",
          quantity: "1",
          unit: catalogProducts[0]?.unit || "piece",
          isMandatory: true,
          notes: "",
        },
      ],
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = async (recipe: Recipe) => {
    setEditingRecipe(recipe);
    // Fetch full recipe details with ingredients
    let fullRecipe = recipe;
    if (!recipe.ingredients) {
      const res = await apiClient<{ recipe: Recipe }>(`/api/recipes/${recipe.id}`);
      if (res.success && res.data) {
        fullRecipe = res.data.recipe;
      }
    }

    const rows: IngredientRow[] =
      fullRecipe.ingredients && fullRecipe.ingredients.length > 0
        ? fullRecipe.ingredients
            .filter((ing) => Boolean(ing.productId))
            .map((ing) => ({
              productId: ing.productId || "",
              quantity: String(ing.quantity),
              unit: ing.unit || "piece",
              isMandatory: ing.isMandatory,
              notes: ing.notes || "",
            }))
        : [
            {
              productId: catalogProducts[0]?.id || "",
              quantity: "1",
              unit: "piece",
              isMandatory: true,
              notes: "",
            },
          ];

    setFormData({
      title: fullRecipe.title,
      description: fullRecipe.description || "",
      cuisine: fullRecipe.cuisine || "Indian",
      prepTimeMinutes: String(fullRecipe.prepTimeMinutes || 15),
      cookTimeMinutes: String(fullRecipe.cookTimeMinutes || 25),
      servings: String(fullRecipe.servings || 2),
      difficulty: (fullRecipe.difficulty as any) || "EASY",
      dietaryType: fullRecipe.dietaryType || "VEG",
      imageUrl: fullRecipe.imageUrl || "",
      instructions: fullRecipe.instructions || "",
      isActive: fullRecipe.isActive,
      ingredients: rows.length > 0 ? rows : [
        {
          productId: catalogProducts[0]?.id || "",
          quantity: "1",
          unit: "piece",
          isMandatory: true,
          notes: "",
        },
      ],
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingRecipe(null);
    setFormErrors({});
  };

  const addIngredientRow = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          productId: catalogProducts[0]?.id || "",
          quantity: "1",
          unit: "piece",
          isMandatory: true,
          notes: "",
        },
      ],
    }));
  };

  const removeIngredientRow = (index: number) => {
    if (formData.ingredients.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredientRow = (index: number, field: keyof IngredientRow, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const validateRecipeForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      errs.title = "Recipe title must be at least 2 characters";
    }
    if (!formData.instructions.trim() || formData.instructions.trim().length < 10) {
      errs.instructions = "Instructions must be at least 10 characters long";
    }
    const servingsNum = parseInt(formData.servings, 10);
    if (isNaN(servingsNum) || servingsNum < 1) {
      errs.servings = "Servings must be at least 1";
    }
    const prepNum = parseInt(formData.prepTimeMinutes, 10);
    if (isNaN(prepNum) || prepNum < 0) {
      errs.prepTimeMinutes = "Prep time cannot be negative";
    }
    const cookNum = parseInt(formData.cookTimeMinutes, 10);
    if (isNaN(cookNum) || cookNum < 0) {
      errs.cookTimeMinutes = "Cook time cannot be negative";
    }
    if (formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl.trim());
      } catch {
        errs.imageUrl = "Please enter a valid image URL";
      }
    }

    if (formData.ingredients.length === 0) {
      errs.ingredients = "A recipe must contain at least one ingredient";
    } else {
      formData.ingredients.forEach((ing, i) => {
        if (!ing.productId) {
          errs[`ing_${i}_product`] = "Product is required";
        }
        const qNum = parseFloat(ing.quantity);
        if (isNaN(qNum) || qNum <= 0) {
          errs[`ing_${i}_qty`] = "Quantity must be > 0";
        }
        if (!ing.unit.trim()) {
          errs[`ing_${i}_unit`] = "Unit is required";
        }
      });
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipeForm()) return;

    setIsSaving(true);
    setFormErrors({});

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      cuisine: formData.cuisine.trim(),
      prepTimeMinutes: parseInt(formData.prepTimeMinutes, 10),
      cookTimeMinutes: parseInt(formData.cookTimeMinutes, 10),
      servings: parseInt(formData.servings, 10),
      difficulty: formData.difficulty,
      dietaryType: formData.dietaryType,
      imageUrl: formData.imageUrl.trim() || undefined,
      instructions: formData.instructions.trim(),
      isActive: formData.isActive,
      ingredients: formData.ingredients.map((ing) => ({
        productId: ing.productId,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit.trim(),
        isMandatory: ing.isMandatory,
        notes: ing.notes.trim() || undefined,
      })),
    };

    let res;
    if (editingRecipe) {
      res = await apiClient<{ recipe: Recipe }>(`/api/recipes/${editingRecipe.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiClient<{ recipe: Recipe }>("/api/recipes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    if (res.success) {
      setSuccessMessage(
        editingRecipe ? "Recipe updated successfully!" : "Recipe created successfully!"
      );
      closeFormModal();
      if (selectedRecipe && editingRecipe && selectedRecipe.id === editingRecipe.id) {
        viewRecipeDetails(editingRecipe.id);
      }
      fetchRecipes();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      if (res.errors && res.errors.length > 0) {
        const backendErrs: Record<string, string> = {};
        res.errors.forEach((e) => {
          backendErrs[e.field] = e.message;
        });
        setFormErrors(backendErrs);
      } else {
        setFormErrors({ general: res.message || "Failed to save recipe" });
      }
    }
    setIsSaving(false);
  };

  const openImportModal = () => {
    setMealDbIdInput("");
    setImportResult(null);
    setImportError(null);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportResult(null);
    setImportError(null);
  };

  const handleImportMealDb = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const targetId = (customId || mealDbIdInput).trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      setImportError("Please enter a valid numeric TheMealDB ID (e.g. 52771).");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    const res = await apiClient<{
      recipe: Recipe;
      isAlreadyImported: boolean;
      stats?: { totalIngredients: number; matchedCount: number; unmatchedCount: number };
    }>(`/api/recipes/import/themealdb/${targetId}`, {
      method: "POST",
    });

    if (res.success && res.data) {
      setImportResult({
        isAlreadyImported: res.data.isAlreadyImported,
        stats: res.data.stats,
        message: res.message,
      });
      fetchRecipes();
      if (res.data.recipe) {
        viewRecipeDetails(res.data.recipe.id);
      }
    } else {
      setImportError(res.message || "Failed to import recipe from TheMealDB.");
    }
    setIsImporting(false);
  };

  const openDeleteModal = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRecipeToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await apiClient(`/api/recipes/${recipeToDelete.id}`, {
      method: "DELETE",
    });

    if (res.success) {
      setSuccessMessage(res.message || "Recipe deleted successfully!");
      closeDeleteModal();
      if (selectedRecipe && selectedRecipe.id === recipeToDelete.id) {
        setSelectedRecipe(null);
      }
      fetchRecipes();
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setDeleteError(res.message || "Failed to delete recipe");
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
              <BookOpen className="w-5 h-5 text-[#B34E22]" />
              <span>Smart Recipes Engine</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Manage cuisines, recipe ingredient mappings, serving calculators, and TheMealDB imports
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRecipes()}
                placeholder="Search recipes..."
                style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                className="w-56 pl-9 pr-3 py-2 bg-white border border-[#E8E2D5] rounded-xl text-xs text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
            </div>

            <button
              onClick={fetchRecipes}
              style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
              className="p-2.5 bg-white hover:bg-[#FAF6ED] text-[#504932] rounded-xl border border-[#E8E2D5] shadow-xs transition-all cursor-pointer"
              title="Refresh Recipes"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={openImportModal}
              style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] text-xs font-extrabold rounded-xl border-2 border-[#C8BEA7] shadow-xs transition-all cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-[#B34E22]" />
              <span style={{ color: "#504932" }} className="font-extrabold">Import TheMealDB</span>
            </button>

            <button
              onClick={openCreateModal}
              style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span style={{ color: "#ffffff" }} className="text-white font-bold">Create Recipe</span>
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

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CUISINES.map((c) => {
            const isActive = selectedCuisine === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
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
                  {c}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-[#7A7056]">
              <RefreshCw className="w-6 h-6 text-[#B34E22] animate-spin mx-auto mb-2" />
              <p className="font-semibold text-xs">Loading smart recipe library...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#7A7056] bg-white border border-[#E8E2D5] rounded-3xl p-8">
              <BookOpen className="w-10 h-10 text-[#9C937E] mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-sm text-[#504932]">No recipes found</h3>
              <p className="text-xs text-[#7A7056] mt-1 max-w-sm mx-auto">
                Try searching for another dish, changing your cuisine filter, or importing recipes from TheMealDB.
              </p>
              <button
                onClick={openImportModal}
                style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <DownloadCloud className="w-4 h-4 text-white" />
                <span>Import from TheMealDB</span>
              </button>
            </div>
          ) : (
            recipes.map((r) => (
              <div
                key={r.id}
                onClick={() => viewRecipeDetails(r.id)}
                className="bg-white border border-[#E8E2D5] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col"
              >
                {/* Image Header */}
                <div className="h-44 bg-[#FAF6ED] relative overflow-hidden">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#9C937E] gap-1">
                      <ChefHat className="w-8 h-8 opacity-40" />
                      <span className="text-xs font-semibold">No Image</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-xs text-[10px] font-extrabold text-white uppercase tracking-wider">
                      {r.cuisine}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${getDietaryBadge(
                        r.dietaryType
                      )}`}
                    >
                      {r.dietaryType}
                    </span>
                  </div>

                  {r.source === "THEMEALDB" && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF6ED]/90 backdrop-blur-xs text-[10px] font-bold text-[#504932] border border-[#E8E2D5] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#B34E22]" />
                        TheMealDB
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#504932] line-clamp-1 group-hover:text-[#B34E22] transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#7A7056] mt-1 line-clamp-2">
                      {r.description || "Fresh ingredients mapped for automatic grocery bundling."}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-[#F0EAE1] grid grid-cols-3 gap-2 text-[11px] text-[#7A7056]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span className="font-semibold">{r.prepTimeMinutes + r.cookTimeMinutes}m</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6A6332]" />
                      <span className="font-semibold">{r.servings} Servings</span>
                    </div>
                    <div className="text-right font-extrabold text-[#504932]">
                      {r._count?.ingredients || r.ingredients?.length || 0} items
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF6ED] text-[#504932] border border-[#E8E2D5]">
                      {r.difficulty}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(r);
                        }}
                        style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#E8E2D5" }}
                        className="p-1.5 rounded-lg bg-[#FAF6ED] hover:bg-[#EBD3AA] text-[#504932] border border-[#E8E2D5] transition-all cursor-pointer"
                        title="Edit Recipe"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#504932]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(r);
                        }}
                        style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                        className="p-1.5 rounded-lg bg-[#FFF7ED] hover:bg-red-100 text-[#B34E22] border border-[#FDBA74] transition-all cursor-pointer"
                        title="Delete Recipe"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RECIPE DETAILS SLIDE-OVER DRAWER */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="flex-1" onClick={closeRecipeDetails} />

            <div className="w-full max-w-2xl bg-[#FFFCF5] border-l border-[#E8E2D5] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="px-6 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="font-extrabold text-base text-[#504932]">{selectedRecipe.title}</h3>
                    <p className="text-xs text-[#7A7056]">
                      {selectedRecipe.cuisine} Cuisine • {selectedRecipe.servings} Base Servings •{" "}
                      {selectedRecipe.dietaryType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRecipeDetails}
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#E8E2D5" }}
                  className="p-2 rounded-xl text-[#504932] hover:bg-[#EBD3AA] border border-[#E8E2D5] transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4 text-[#504932]" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingRecipeDetails && (
                  <div className="py-12 flex flex-col items-center justify-center text-[#7A7056] gap-2">
                    <RefreshCw className="w-6 h-6 text-[#B34E22] animate-spin" />
                    <p className="text-xs font-semibold">Fetching recipe ingredients & grocery mappings...</p>
                  </div>
                )}

                {/* Hero Snapshot */}
                {selectedRecipe.imageUrl && (
                  <div className="h-56 rounded-2xl overflow-hidden border border-[#E8E2D5] shadow-xs">
                    <img
                      src={selectedRecipe.imageUrl}
                      alt={selectedRecipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#7A7056]">Prep Time</span>
                    <p className="text-sm font-extrabold text-[#504932] mt-0.5">
                      {selectedRecipe.prepTimeMinutes}m
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#7A7056]">Cook Time</span>
                    <p className="text-sm font-extrabold text-[#504932] mt-0.5">
                      {selectedRecipe.cookTimeMinutes}m
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#7A7056]">Servings</span>
                    <p className="text-sm font-extrabold text-[#B34E22] mt-0.5">
                      {selectedRecipe.servings}
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#7A7056]">Difficulty</span>
                    <p className="text-sm font-extrabold text-[#6A6332] mt-0.5">
                      {selectedRecipe.difficulty}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-white border border-[#E8E2D5] rounded-2xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#B34E22]" />
                    <span>Cooking Instructions</span>
                  </h4>
                  <div className="text-xs text-[#504932] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-1">
                    {selectedRecipe.instructions}
                  </div>
                </div>

                {/* Ingredients Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span>
                        Recipe Ingredients ({selectedRecipe.ingredients?.length || 0})
                      </span>
                    </h4>
                    <span className="text-[11px] text-[#7A7056]">
                      Mapped to Ingrezy Catalog Products
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#E8E2D5] overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF6ED] text-[#504932] text-xs uppercase font-bold border-b border-[#E8E2D5]">
                        <tr>
                          <th className="py-2.5 px-3">Ingredient / Product</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3 text-center">Type</th>
                          <th className="py-2.5 px-3 text-right">Catalog Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                        {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                          selectedRecipe.ingredients.map((ing, idx) => (
                            <tr key={ing.id || idx} className="hover:bg-[#FAF6ED]/50 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-[#504932] text-xs">
                                  {ing.product?.name || ing.ingredientName || "Unnamed Ingredient"}
                                </div>
                                {ing.notes && (
                                  <div className="text-[10px] text-[#7A7056]">{ing.notes}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-[#504932]">
                                {ing.quantity} {ing.unit}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    ing.isMandatory
                                      ? "bg-amber-50 text-amber-900 border border-amber-200"
                                      : "bg-stone-50 text-stone-600 border border-stone-200"
                                  }`}
                                >
                                  {ing.isMandatory ? "Mandatory" : "Optional"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {ing.product ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>₹{Number(ing.product.basePrice).toFixed(0)}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    Unmapped
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-[#7A7056] italic">
                              No ingredients listed for this recipe.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Drawer Footer with Actions */}
              <div className="px-6 py-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between">
                <button
                  onClick={() => openDeleteModal(selectedRecipe)}
                  style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#FFF7ED] hover:bg-red-100 text-[#B34E22] text-xs font-bold rounded-xl border border-[#FDBA74] transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeRecipeDetails}
                    style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                    className="px-5 py-2 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border-2 border-[#C8BEA7] transition-all cursor-pointer shadow-xs"
                  >
                    <span style={{ color: "#504932" }} className="font-extrabold">Close</span>
                  </button>

                  <button
                    onClick={() => {
                      openEditModal(selectedRecipe);
                    }}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-white" />
                    <span style={{ color: "#ffffff" }} className="font-bold">Edit Recipe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* THEMEALDB IMPORT MODAL */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">Import from TheMealDB</h3>
                    <p className="text-[11px] text-[#7A7056]">
                      Ingest curated recipes with automatic catalog ingredient matching
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeImportModal}
                  style={{ color: "#504932" }}
                  className="p-1.5 rounded-lg text-[#7A7056] hover:text-[#504932] hover:bg-[#EBD3AA]/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {importError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{importError}</span>
                  </div>
                )}

                {importResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                      importResult.isAlreadyImported
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {importResult.isAlreadyImported ? (
                        <Info className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>
                        {importResult.isAlreadyImported
                          ? "Recipe Already Exists in Database"
                          : "Recipe Successfully Imported!"}
                      </span>
                    </div>
                    {importResult.stats && (
                      <p className="text-[11px]">
                        Extracted {importResult.stats.totalIngredients} ingredients (
                        {importResult.stats.matchedCount} mapped to Ingrezy catalog products,{" "}
                        {importResult.stats.unmatchedCount} unmapped).
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={(e) => handleImportMealDb(e)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      TheMealDB Meal ID <span className="text-[#B34E22]">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mealDbIdInput}
                        onChange={(e) => setMealDbIdInput(e.target.value)}
                        placeholder="e.g. 52771"
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                      />
                      <button
                        type="submit"
                        disabled={isImporting || !mealDbIdInput.trim()}
                        style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                      >
                        {isImporting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                        <span style={{ color: "#ffffff" }} className="font-bold">
                          {isImporting ? "Importing..." : "Import"}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Popular MealDB Suggestions */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-[#7A7056] mb-2 uppercase tracking-wider">
                    Quick Import Popular Dishes:
                  </span>
                  <div className="space-y-1.5">
                    {POPULAR_MEALDB_SUGGESTIONS.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 bg-[#FAF6ED] rounded-xl border border-[#E8E2D5] hover:border-[#B34E22] transition-colors"
                      >
                        <div className="text-xs">
                          <span className="font-bold text-[#504932]">{item.name}</span>
                          <span className="text-[10px] text-[#7A7056] font-mono ml-2">
                            ID: {item.id}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isImporting}
                          onClick={() => {
                            setMealDbIdInput(item.id);
                            handleImportMealDb(undefined, item.id);
                          }}
                          style={{ color: "#B34E22", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#E8E2D5] hover:bg-[#B34E22] hover:text-white transition-all cursor-pointer"
                        >
                          Import
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={closeImportModal}
                    style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                    className="px-5 py-2 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border-2 border-[#C8BEA7] transition-all cursor-pointer shadow-xs"
                  >
                    <span style={{ color: "#504932" }} className="font-extrabold">Done</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT RECIPE MODAL */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-3xl bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">
                      {editingRecipe ? "Edit Recipe" : "Create New Smart Recipe"}
                    </h3>
                    <p className="text-[11px] text-[#7A7056]">
                      {editingRecipe
                        ? `Editing #${editingRecipe.slug}`
                        : "Configure cuisine, cooking instructions, servings, and mapped grocery items"}
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
              <form onSubmit={handleSaveRecipe} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                {formErrors.general && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.general}</span>
                  </div>
                )}

                {/* Recipe Title & Cuisine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">
                      Recipe Title <span className="text-[#B34E22]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Authentic Paneer Butter Masala"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    {formErrors.title && (
                      <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Cuisine</label>
                    <select
                      value={formData.cuisine}
                      onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22] bg-white cursor-pointer"
                    >
                      {CUISINES.filter((c) => c !== "ALL").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metrics: Prep, Cook, Servings, Difficulty, Dietary */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Prep (mins)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.prepTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, prepTimeMinutes: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    {formErrors.prepTimeMinutes && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.prepTimeMinutes}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Cook (mins)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cookTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, cookTimeMinutes: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    {formErrors.cookTimeMinutes && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.cookTimeMinutes}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Servings</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    {formErrors.servings && (
                      <p className="text-[10px] text-red-600 mt-1">{formErrors.servings}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22] bg-white cursor-pointer"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Dietary</label>
                    <select
                      value={formData.dietaryType}
                      onChange={(e) => setFormData({ ...formData, dietaryType: e.target.value })}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22] bg-white cursor-pointer"
                    >
                      <option value="VEG">VEG</option>
                      <option value="NON_VEG">NON_VEG</option>
                      <option value="CONTAINS_EGG">CONTAINS_EGG</option>
                      <option value="VEGAN">VEGAN</option>
                    </select>
                  </div>
                </div>

                {/* Image URL & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#504932] mb-1">Short Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Rich, velvety tomato gravy with paneer cubes"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">
                    Cooking Instructions <span className="text-[#B34E22]">* (min 10 characters)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Step-by-step preparation instructions..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                  />
                  {formErrors.instructions && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{formErrors.instructions}</p>
                  )}
                </div>

                {/* Ingredients Section */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D5]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#504932] uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#B34E22]" />
                        <span>Recipe Ingredients ({formData.ingredients.length})</span>
                      </h4>
                      <p className="text-[11px] text-[#7A7056]">
                        Link items to catalog products for 1-click grocery cart bundling
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addIngredientRow}
                      style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                      className="flex items-center gap-1 px-3 py-1 bg-[#FFF7ED] hover:bg-[#B34E22] hover:text-white text-[#B34E22] text-xs font-bold rounded-xl border border-[#FDBA74] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Ingredient</span>
                    </button>
                  </div>

                  {formErrors.ingredients && (
                    <p className="text-[11px] text-red-600 font-semibold">{formErrors.ingredients}</p>
                  )}

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {formData.ingredients.map((row, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF6ED] rounded-xl border border-[#E8E2D5] grid grid-cols-12 gap-2 items-center text-xs"
                      >
                        {/* Product Picker */}
                        <div className="col-span-5">
                          <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                            Catalog Product
                          </label>
                          <select
                            value={row.productId}
                            onChange={(e) => updateIngredientRow(idx, "productId", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                          >
                            <option value="">-- Select Product --</option>
                            {catalogProducts.map((cp) => (
                              <option key={cp.id} value={cp.id}>
                                {cp.name} ({cp.unit} • ₹{Number(cp.basePrice).toFixed(0)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={row.quantity}
                            onChange={(e) => updateIngredientRow(idx, "quantity", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                          />
                        </div>

                        {/* Unit */}
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => updateIngredientRow(idx, "unit", e.target.value)}
                            placeholder="g / ml / piece"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                          />
                        </div>

                        {/* Mandatory Checkbox */}
                        <div className="col-span-2 flex flex-col items-center justify-center">
                          <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                            Mandatory
                          </label>
                          <input
                            type="checkbox"
                            checked={row.isMandatory}
                            onChange={(e) => updateIngredientRow(idx, "isMandatory", e.target.checked)}
                            className="w-4 h-4 rounded border-[#E8E2D5] text-[#B34E22] focus:ring-0"
                          />
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 flex items-end justify-center pt-3">
                          <button
                            type="button"
                            onClick={() => removeIngredientRow(idx)}
                            disabled={formData.ingredients.length <= 1}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="Remove Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    Publish recipe to customer mobile app (Active)
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
                    <span style={{ color: "#504932" }} className="font-extrabold">Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-[#B34E22]/25 transition-all cursor-pointer"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span style={{ color: "#ffffff" }} className="text-white font-extrabold">
                      {isSaving ? "Saving..." : editingRecipe ? "Save Changes" : "Create Recipe"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE RECIPE CONFIRMATION MODAL */}
        {isDeleteModalOpen && recipeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#FFF7ED] border-b border-[#FDBA74] flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900">Delete Recipe</h3>
                  <p className="text-[11px] text-[#7A7056]">This action removes the recipe from the database</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-[#504932]">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-[#B34E22]">{recipeToDelete.title}</strong>?
                </p>
                <div className="p-3 rounded-xl bg-[#FAF6ED] border border-[#E8E2D5] text-[11px] text-[#7A7056]">
                  Associated ingredient links will be cleared automatically.
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
                    <span style={{ color: "#504932" }} className="font-extrabold">Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRecipe}
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
