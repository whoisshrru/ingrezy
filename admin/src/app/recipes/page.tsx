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
  Globe,
  Eye,
  Check,
} from "lucide-react";

interface RecipeIngredient {
  id?: string;
  productId?: string | null;
  ingredientName?: string | null;
  rawMeasure?: string | null;
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
  ingredientName: string;
  quantity: string;
  unit: string;
  productId: string;
  isMandatory: boolean;
  notes: string;
}

interface RecipeFormData {
  title: string;
  descriptionEn: string;
  descriptionMr: string;
  descriptionHi: string;
  cuisine: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  servings: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  dietaryType: string;
  imageUrl: string;
  instructionsEn: string;
  instructionsMr: string;
  instructionsHi: string;
  isActive: boolean;
  ingredients: IngredientRow[];
}

interface MealDbSearchResult {
  idMeal: string;
  title: string;
  category: string;
  cuisine: string;
  imageUrl: string | null;
  instructions: string;
  ingredientCount: number;
  ingredientsSample: string[];
  isAlreadyImported: boolean;
}

const initialRecipeFormData: RecipeFormData = {
  title: "",
  descriptionEn: "",
  descriptionMr: "",
  descriptionHi: "",
  cuisine: "Indian",
  prepTimeMinutes: "15",
  cookTimeMinutes: "25",
  servings: "2",
  difficulty: "EASY",
  dietaryType: "VEG",
  imageUrl: "",
  instructionsEn: "",
  instructionsMr: "",
  instructionsHi: "",
  isActive: true,
  ingredients: [
    {
      ingredientName: "",
      quantity: "1",
      unit: "piece",
      productId: "",
      isMandatory: true,
      notes: "",
    },
  ],
};

const CUISINES = [
  "ALL",
  "Indian",
  "Italian",
  "Mexican",
  "Chinese",
  "American",
  "British",
  "International",
];

const POPULAR_SEARCH_PRESETS = [
  "Chicken",
  "Paneer",
  "Penne",
  "Curry",
  "Soup",
  "Lentil",
  "Salad",
];

function parseMultilingual(content?: string | null): {
  en: string;
  mr: string;
  hi: string;
} {
  if (!content) return { en: "", mr: "", hi: "" };

  const mrIndex = content.indexOf("[मराठी - Marathi]");
  const hiIndex = content.indexOf("[हिंदी - Hindi]");
  const enIndex = content.indexOf("[English]");

  if (mrIndex === -1 && hiIndex === -1 && enIndex === -1) {
    return { en: content, mr: "", hi: "" };
  }

  let en = "";
  let mr = "";
  let hi = "";

  const sections = content.split(/\[(English|मराठी - Marathi|हिंदी - Hindi)\]/);
  for (let i = 1; i < sections.length; i += 2) {
    const tag = sections[i];
    const text = (sections[i + 1] || "").trim();
    if (tag === "English") en = text;
    else if (tag === "मराठी - Marathi") mr = text;
    else if (tag === "हिंदी - Hindi") hi = text;
  }

  return { en: en || content, mr, hi };
}

function formatMultilingual(en: string, mr: string, hi: string): string {
  const parts: string[] = [];
  if (en.trim()) parts.push(`[English]\n${en.trim()}`);
  if (mr.trim()) parts.push(`[मराठी - Marathi]\n${mr.trim()}`);
  if (hi.trim()) parts.push(`[हिंदी - Hindi]\n${hi.trim()}`);

  if (parts.length === 0) return "";
  if (!mr.trim() && !hi.trim()) return en.trim();
  return parts.join("\n\n");
}

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
  const [activeLangTab, setActiveLangTab] = useState<"en" | "mr" | "hi">("en");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // TheMealDB Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [mealDbSearchQuery, setMealDbSearchQuery] = useState("");
  const [isSearchingMealDb, setIsSearchingMealDb] = useState(false);
  const [mealDbResults, setMealDbResults] = useState<MealDbSearchResult[]>([]);
  const [previewMeal, setPreviewMeal] = useState<MealDbSearchResult | null>(null);
  const [manualMealIdInput, setManualMealIdInput] = useState("");
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

  // Open Create Recipe Modal
  const openCreateModal = () => {
    setEditingRecipe(null);
    setActiveLangTab("en");
    setFormData({
      ...initialRecipeFormData,
      ingredients: [
        {
          ingredientName: "",
          quantity: "1",
          unit: "piece",
          productId: "",
          isMandatory: true,
          notes: "",
        },
      ],
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Recipe Modal
  const openEditModal = async (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setActiveLangTab("en");

    let fullRecipe = recipe;
    if (!recipe.ingredients) {
      const res = await apiClient<{ recipe: Recipe }>(`/api/recipes/${recipe.id}`);
      if (res.success && res.data) {
        fullRecipe = res.data.recipe;
      }
    }

    const parsedInstructions = parseMultilingual(fullRecipe.instructions);
    const parsedDescription = parseMultilingual(fullRecipe.description);

    const rows: IngredientRow[] =
      fullRecipe.ingredients && fullRecipe.ingredients.length > 0
        ? fullRecipe.ingredients.map((ing) => ({
            ingredientName: ing.ingredientName || ing.product?.name || "",
            quantity: String(ing.quantity),
            unit: ing.unit || "piece",
            productId: ing.productId || "",
            isMandatory: ing.isMandatory,
            notes: ing.notes || "",
          }))
        : [
            {
              ingredientName: "",
              quantity: "1",
              unit: "piece",
              productId: "",
              isMandatory: true,
              notes: "",
            },
          ];

    setFormData({
      title: fullRecipe.title,
      descriptionEn: parsedDescription.en,
      descriptionMr: parsedDescription.mr,
      descriptionHi: parsedDescription.hi,
      cuisine: fullRecipe.cuisine || "Indian",
      prepTimeMinutes: String(fullRecipe.prepTimeMinutes || 15),
      cookTimeMinutes: String(fullRecipe.cookTimeMinutes || 25),
      servings: String(fullRecipe.servings || 2),
      difficulty: (fullRecipe.difficulty as any) || "EASY",
      dietaryType: fullRecipe.dietaryType || "VEG",
      imageUrl: fullRecipe.imageUrl || "",
      instructionsEn: parsedInstructions.en,
      instructionsMr: parsedInstructions.mr,
      instructionsHi: parsedInstructions.hi,
      isActive: fullRecipe.isActive,
      ingredients: rows,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingRecipe(null);
    setFormErrors({});
  };

  // Ingredient Row Management
  const addIngredientRow = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredientName: "",
          quantity: "1",
          unit: "piece",
          productId: "",
          isMandatory: true,
          notes: "",
        },
      ],
    }));
  };

  const removeIngredientRow = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      updated.splice(index, 1);
      return { ...prev, ingredients: updated };
    });
  };

  const updateIngredientRow = (
    index: number,
    field: keyof IngredientRow,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.ingredients];
      const row = { ...updated[index], [field]: value };

      // If user chooses a grocery catalog product, auto-fill name & unit if blank
      if (field === "productId" && value) {
        const prod = catalogProducts.find((p) => p.id === value);
        if (prod) {
          if (!row.ingredientName.trim()) {
            row.ingredientName = prod.name;
          }
          if (!row.unit.trim() || row.unit === "piece") {
            row.unit = prod.unit;
          }
        }
      }

      updated[index] = row;
      return { ...prev, ingredients: updated };
    });
  };

  // Form Validation
  const validateRecipeForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      errs.title = "Recipe title must be at least 2 characters";
    }

    const hasInstructions =
      formData.instructionsEn.trim().length >= 10 ||
      formData.instructionsMr.trim().length >= 10 ||
      formData.instructionsHi.trim().length >= 10;

    if (!hasInstructions) {
      errs.instructions = "Instructions must be at least 10 characters long (fill in English, Marathi, or Hindi)";
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
        if (!ing.ingredientName.trim() && !ing.productId) {
          errs[`ing_${i}_name`] = "Ingredient name or mapped product is required";
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

  // Save Recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipeForm()) return;

    setIsSaving(true);
    setFormErrors({});

    const formattedInstructions = formatMultilingual(
      formData.instructionsEn,
      formData.instructionsMr,
      formData.instructionsHi
    );

    const formattedDescription = formatMultilingual(
      formData.descriptionEn,
      formData.descriptionMr,
      formData.descriptionHi
    );

    const payload = {
      title: formData.title.trim(),
      description: formattedDescription || undefined,
      cuisine: formData.cuisine.trim(),
      prepTimeMinutes: parseInt(formData.prepTimeMinutes, 10),
      cookTimeMinutes: parseInt(formData.cookTimeMinutes, 10),
      servings: parseInt(formData.servings, 10),
      difficulty: formData.difficulty,
      dietaryType: formData.dietaryType,
      imageUrl: formData.imageUrl.trim() || undefined,
      instructions: formattedInstructions,
      isActive: formData.isActive,
      ingredients: formData.ingredients.map((ing) => ({
        ingredientName: ing.ingredientName.trim() || undefined,
        productId: ing.productId || undefined,
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
        res.errors.forEach((err) => {
          backendErrs[err.field] = err.message;
        });
        setFormErrors(backendErrs);
      } else {
        setFormErrors({ general: res.message || "Failed to save recipe" });
      }
    }
    setIsSaving(false);
  };

  // TheMealDB Import Modal
  const openImportModal = () => {
    setMealDbSearchQuery("");
    setMealDbResults([]);
    setPreviewMeal(null);
    setManualMealIdInput("");
    setImportResult(null);
    setImportError(null);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportResult(null);
    setImportError(null);
    setPreviewMeal(null);
  };

  // Search TheMealDB via backend API
  const handleSearchMealDb = async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : mealDbSearchQuery).trim();
    if (!q) return;

    setIsSearchingMealDb(true);
    setImportError(null);
    setPreviewMeal(null);

    const res = await apiClient<{
      query: string;
      count: number;
      meals: MealDbSearchResult[];
    }>(`/api/recipes/import/themealdb/search?q=${encodeURIComponent(q)}`);

    if (res.success && res.data) {
      setMealDbResults(res.data.meals);
      if (res.data.meals.length === 0) {
        setImportError(`No recipes found on TheMealDB matching '${q}'.`);
      }
    } else {
      setImportError(res.message || "Failed to search TheMealDB");
    }
    setIsSearchingMealDb(false);
  };

  // Import TheMealDB Recipe by ID
  const handleImportMealDb = async (mealId: string) => {
    const targetId = mealId.trim();
    if (!targetId || !/^\d+$/.test(targetId)) {
      setImportError("Please specify a valid numeric TheMealDB ID.");
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

      // Update isAlreadyImported state in search results list
      setMealDbResults((prev) =>
        prev.map((m) => (m.idMeal === targetId ? { ...m, isAlreadyImported: true } : m))
      );

      fetchRecipes();
      if (res.data.recipe) {
        viewRecipeDetails(res.data.recipe.id);
      }
    } else {
      setImportError(res.message || "Failed to import recipe from TheMealDB.");
    }
    setIsImporting(false);
  };

  // Delete Recipe
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
              Manage multi-lingual cooking instructions, ingredient catalog mappings, and TheMealDB imports
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

            {/* Import Recipe Button */}
            <button
              onClick={openImportModal}
              style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] text-xs font-extrabold rounded-xl border-2 border-[#C8BEA7] shadow-xs transition-all cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-[#B34E22]" />
              <span className="font-extrabold">Import Recipe</span>
            </button>

            {/* + Add Recipe Button */}
            <button
              onClick={openCreateModal}
              style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span style={{ color: "#ffffff" }} className="text-white font-bold">+ Add Recipe</span>
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
                <span>{c}</span>
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
            <div className="col-span-full py-16 text-center text-[#7A7056] bg-white rounded-3xl border border-[#E8E2D5] p-8">
              <ChefHat className="w-10 h-10 text-[#9C937E] mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-sm text-[#504932]">No recipes found</h3>
              <p className="text-xs text-[#7A7056] max-w-sm mx-auto mt-1 mb-4">
                {selectedCuisine !== "ALL"
                  ? `No recipes found under ${selectedCuisine} cuisine.`
                  : "Start creating signature dishes or import from TheMealDB."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={openCreateModal}
                  style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                  className="px-4 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Add Recipe
                </button>
                <button
                  onClick={openImportModal}
                  className="px-4 py-2 bg-[#FAF6ED] text-[#504932] border border-[#E8E2D5] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#E8DFC9]"
                >
                  Import Recipe
                </button>
              </div>
            </div>
          ) : (
            recipes.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[#E8E2D5] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Recipe Card Image */}
                <div className="relative h-44 w-full bg-[#FAF6ED] overflow-hidden border-b border-[#E8E2D5]">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#9C937E]">
                      <ChefHat className="w-10 h-10 stroke-1 mb-1" />
                      <span className="text-[11px] font-semibold">No Image</span>
                    </div>
                  )}

                  {/* Dietary badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] border shadow-xs ${getDietaryBadge(r.dietaryType)}`}>
                      {r.dietaryType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/95 text-[#504932] border border-[#E8E2D5] shadow-xs">
                      {r.cuisine}
                    </span>
                  </div>

                  {/* Source indicator */}
                  {r.source === "THEMEALDB" && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#FAF6ED]/95 text-[#B34E22] border border-[#E8E2D5] shadow-xs">
                      TheMealDB
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#504932] line-clamp-1 group-hover:text-[#B34E22] transition-colors">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="text-xs text-[#7A7056] line-clamp-2 mt-1">
                        {r.description.replace(/\[.*?\]/g, "")}
                      </p>
                    )}
                  </div>

                  {/* Meta Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#FAF6ED] text-[11px] text-[#7A7056]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span>{r.prepTimeMinutes + r.cookTimeMinutes}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span>{r.servings} serving{r.servings > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span>{r._count?.ingredients || 0} items</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => viewRecipeDetails(r.id)}
                      className="text-xs font-bold text-[#B34E22] hover:text-[#8F3E1A] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Recipe</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded-lg bg-[#FAF6ED] hover:bg-[#EBD3AA] text-[#504932] border border-[#E8E2D5] transition-all cursor-pointer"
                        title="Edit Recipe"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(r)}
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

        {/* DETAIL DRAWER / MODAL */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Drawer Header */}
              <div className="relative h-44 bg-[#FAF6ED] border-b border-[#E8E2D5] shrink-0">
                {selectedRecipe.imageUrl ? (
                  <img
                    src={selectedRecipe.imageUrl}
                    alt={selectedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#9C937E]">
                    <ChefHat className="w-12 h-12 stroke-1" />
                  </div>
                )}
                <button
                  onClick={closeRecipeDetails}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] border shadow-xs ${getDietaryBadge(selectedRecipe.dietaryType)}`}>
                    {selectedRecipe.dietaryType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#504932] border border-[#E8E2D5] shadow-xs">
                    {selectedRecipe.cuisine}
                  </span>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#504932]">{selectedRecipe.title}</h3>
                  {selectedRecipe.description && (
                    <p className="text-xs text-[#7A7056] mt-1 whitespace-pre-line">
                      {selectedRecipe.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF6ED] rounded-2xl border border-[#E8E2D5] text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#7A7056] uppercase block">Prep Time</span>
                    <span className="font-extrabold text-[#504932]">{selectedRecipe.prepTimeMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7A7056] uppercase block">Cook Time</span>
                    <span className="font-extrabold text-[#504932]">{selectedRecipe.cookTimeMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7A7056] uppercase block">Servings</span>
                    <span className="font-extrabold text-[#504932]">{selectedRecipe.servings} people</span>
                  </div>
                </div>

                {/* Ingredients List */}
                <div>
                  <h4 className="text-xs font-bold text-[#504932] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#B34E22]" />
                    <span>Ingredients ({selectedRecipe.ingredients?.length || 0})</span>
                  </h4>

                  <div className="space-y-1.5">
                    {selectedRecipe.ingredients?.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-[#FAF6ED]/70 rounded-xl border border-[#E8E2D5] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#504932]">
                            {ing.ingredientName || ing.product?.name || "Ingredient"}
                          </span>
                          {ing.product && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                              Mapped: {ing.product.name}
                            </span>
                          )}
                          {!ing.product && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                              Unmapped Catalog
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-extrabold text-[#B34E22]">
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-xs font-bold text-[#504932] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#B34E22]" />
                    <span>Cooking Instructions</span>
                  </h4>
                  <div className="p-4 bg-[#FAF6ED] rounded-2xl border border-[#E8E2D5] text-xs text-[#504932] leading-relaxed whitespace-pre-line font-medium">
                    {selectedRecipe.instructions}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-[#FAF6ED] border-t border-[#E8E2D5] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-[#7A7056]">
                  Slug: <code className="font-mono">{selectedRecipe.slug}</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const r = selectedRecipe;
                      closeRecipeDetails();
                      openEditModal(r);
                    }}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="px-4 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Edit Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT RECIPE MODAL */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-3xl bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">
                      {editingRecipe ? "Edit Recipe" : "Add New Recipe"}
                    </h3>
                    <p className="text-[11px] text-[#7A7056]">
                      Recipe title, multi-lingual instructions, ingredients & grocery mapping
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
              <form onSubmit={handleSaveRecipe} className="p-6 space-y-4 overflow-y-auto flex-1">
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

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-[#504932] mb-1">Recipe Image URL</label>
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

                {/* Multilingual Tabs: English, Marathi, Hindi */}
                <div className="pt-2 border-t border-[#E8E2D5]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#504932] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#B34E22]" />
                      <span>Multi-Lingual Content (Instructions & Description)</span>
                    </span>

                    {/* Language Switcher Tabs */}
                    <div className="inline-flex rounded-xl bg-[#FAF6ED] p-1 border border-[#E8E2D5]">
                      <button
                        type="button"
                        onClick={() => setActiveLangTab("en")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeLangTab === "en"
                            ? "bg-[#B34E22] text-white shadow-xs"
                            : "text-[#504932] hover:bg-white"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab("mr")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeLangTab === "mr"
                            ? "bg-[#B34E22] text-white shadow-xs"
                            : "text-[#504932] hover:bg-white"
                        }`}
                      >
                        मराठी (Marathi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab("hi")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeLangTab === "hi"
                            ? "bg-[#B34E22] text-white shadow-xs"
                            : "text-[#504932] hover:bg-white"
                        }`}
                      >
                        हिंदी (Hindi)
                      </button>
                    </div>
                  </div>

                  {/* Active Language Fields */}
                  {activeLangTab === "en" && (
                    <div className="space-y-3 p-3 bg-[#FAF6ED]/50 rounded-2xl border border-[#E8E2D5]">
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          English Description
                        </label>
                        <input
                          type="text"
                          value={formData.descriptionEn}
                          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                          placeholder="Short summary in English..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          English Cooking Instructions <span className="text-[#B34E22]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.instructionsEn}
                          onChange={(e) => setFormData({ ...formData, instructionsEn: e.target.value })}
                          placeholder="1. Heat oil in a pan...\n2. Add diced onions and saute until golden..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                    </div>
                  )}

                  {activeLangTab === "mr" && (
                    <div className="space-y-3 p-3 bg-[#FAF6ED]/50 rounded-2xl border border-[#E8E2D5]">
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          मराठी वर्णन (Marathi Description)
                        </label>
                        <input
                          type="text"
                          value={formData.descriptionMr}
                          onChange={(e) => setFormData({ ...formData, descriptionMr: e.target.value })}
                          placeholder="मराठीत रेसिपीचा थोडक्यात सारांश..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          मराठी कृती (Marathi Instructions)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.instructionsMr}
                          onChange={(e) => setFormData({ ...formData, instructionsMr: e.target.value })}
                          placeholder="१. कढईत तेल गरम करा...\n२. कांदा घालून सोनेरी रंगावर परता..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                    </div>
                  )}

                  {activeLangTab === "hi" && (
                    <div className="space-y-3 p-3 bg-[#FAF6ED]/50 rounded-2xl border border-[#E8E2D5]">
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          हिंदी विवरण (Hindi Description)
                        </label>
                        <input
                          type="text"
                          value={formData.descriptionHi}
                          onChange={(e) => setFormData({ ...formData, descriptionHi: e.target.value })}
                          placeholder="हिंदी में संक्षेप विवरण..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#504932] mb-1">
                          हिंदी विधि (Hindi Instructions)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.instructionsHi}
                          onChange={(e) => setFormData({ ...formData, instructionsHi: e.target.value })}
                          placeholder="१. एक पैन में तेल गरम करें...\n२. कटा हुआ प्याज डालें और सुनहरा होने तक भूनें..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D5] bg-white focus:outline-none focus:border-[#B34E22]"
                        />
                      </div>
                    </div>
                  )}

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
                        Specify ingredient name, quantity, unit, and optional catalog product mapping
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addIngredientRow}
                      style={{ color: "#B34E22", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#FFF7ED] hover:bg-[#B34E22] hover:text-white text-[#B34E22] text-xs font-bold rounded-xl border border-[#FDBA74] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Ingredient Row</span>
                    </button>
                  </div>

                  {formErrors.ingredients && (
                    <p className="text-[11px] text-red-600 font-semibold">{formErrors.ingredients}</p>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {formData.ingredients.map((row, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF6ED] rounded-xl border border-[#E8E2D5] space-y-2 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          {/* Ingredient Name */}
                          <div className="sm:col-span-4">
                            <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                              Ingredient Name <span className="text-[#B34E22]">*</span>
                            </label>
                            <input
                              type="text"
                              value={row.ingredientName}
                              onChange={(e) => updateIngredientRow(idx, "ingredientName", e.target.value)}
                              placeholder="e.g. Red Onions or Cumin"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22]"
                            />
                            {formErrors[`ing_${idx}_name`] && (
                              <p className="text-[10px] text-red-600 mt-0.5 font-semibold">
                                {formErrors[`ing_${idx}_name`]}
                              </p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                              Quantity <span className="text-[#B34E22]">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={row.quantity}
                              onChange={(e) => updateIngredientRow(idx, "quantity", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22]"
                            />
                          </div>

                          {/* Unit */}
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                              Unit <span className="text-[#B34E22]">*</span>
                            </label>
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) => updateIngredientRow(idx, "unit", e.target.value)}
                              placeholder="g, ml, piece, tsp"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22]"
                            />
                          </div>

                          {/* Grocery Catalog Mapping */}
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-bold text-[#7A7056] block mb-0.5">
                              Map to Grocery Item (Optional)
                            </label>
                            <select
                              value={row.productId}
                              onChange={(e) => updateIngredientRow(idx, "productId", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#E8E2D5] bg-white text-[#504932] focus:outline-none focus:border-[#B34E22] cursor-pointer"
                            >
                              <option value="">-- No Catalog Mapping --</option>
                              {catalogProducts.map((cp) => (
                                <option key={cp.id} value={cp.id}>
                                  {cp.name} ({cp.unit} • ₹{Number(cp.basePrice).toFixed(0)})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Remove button */}
                          <div className="sm:col-span-1 flex items-center justify-center pt-3">
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

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border border-[#E8E2D5] transition-all cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-[#B34E22]/25 transition-all cursor-pointer"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span>{isSaving ? "Saving..." : editingRecipe ? "Save Changes" : "Create Recipe"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* THEMEALDB IMPORT & SEARCH MODAL */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-5 h-5 text-[#B34E22]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">TheMealDB Recipe Importer</h3>
                    <p className="text-[11px] text-[#7A7056]">
                      Search global recipes, preview ingredients, and import into Ingrezy PostgreSQL catalog
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
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
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
                          ? "Recipe Already Exists in Database (Idempotent)"
                          : "Recipe Successfully Imported to Ingrezy Database!"}
                      </span>
                    </div>
                    {importResult.stats && (
                      <p className="text-[11px]">
                        Processed {importResult.stats.totalIngredients} ingredients (
                        {importResult.stats.matchedCount} mapped to existing catalog products,{" "}
                        {importResult.stats.unmatchedCount} safely preserved as custom ingredients).
                      </p>
                    )}
                  </div>
                )}

                {/* Live Search Form */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#504932]">
                    Search Recipes by Name or Ingredient:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={mealDbSearchQuery}
                        onChange={(e) => setMealDbSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchMealDb()}
                        placeholder="e.g. Chicken, Paneer, Penne, Lentil, Curry..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                      />
                      <Search className="w-3.5 h-3.5 text-[#9C937E] absolute left-3 top-3" />
                    </div>
                    <button
                      type="button"
                      disabled={isSearchingMealDb || !mealDbSearchQuery.trim()}
                      onClick={() => handleSearchMealDb()}
                      style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                      className="px-4 py-2 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      {isSearchingMealDb && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                      <span>{isSearchingMealDb ? "Searching..." : "Search"}</span>
                    </button>
                  </div>

                  {/* Preset keyword pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#7A7056] mr-1">Popular:</span>
                    {POPULAR_SEARCH_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setMealDbSearchQuery(preset);
                          handleSearchMealDb(preset);
                        }}
                        className="px-2 py-0.5 text-[10px] rounded-lg border border-[#E8E2D5] bg-[#FAF6ED] text-[#504932] hover:bg-[#EBD3AA] transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Results Display */}
                {mealDbResults.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#E8E2D5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#504932]">
                        TheMealDB Search Results ({mealDbResults.length}):
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {mealDbResults.map((meal) => (
                        <div
                          key={meal.idMeal}
                          className="p-3 bg-[#FAF6ED] rounded-2xl border border-[#E8E2D5] flex items-center justify-between gap-3 hover:border-[#B34E22] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E2D5] overflow-hidden shrink-0">
                              {meal.imageUrl ? (
                                <img
                                  src={meal.imageUrl}
                                  alt={meal.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ChefHat className="w-6 h-6 text-[#9C937E] m-auto mt-3" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#504932]">{meal.title}</div>
                              <div className="text-[10px] text-[#7A7056] flex items-center gap-2 mt-0.5">
                                <span>{meal.cuisine} • {meal.category}</span>
                                <span>•</span>
                                <span>{meal.ingredientCount} ingredients</span>
                              </div>
                              {meal.ingredientsSample.length > 0 && (
                                <div className="text-[10px] text-[#9C937E] mt-0.5 line-clamp-1">
                                  Includes: {meal.ingredientsSample.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {meal.isAlreadyImported ? (
                              <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Imported</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isImporting}
                                onClick={() => handleImportMealDb(meal.idMeal)}
                                style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                                className="px-3 py-1.5 text-xs font-bold bg-[#B34E22] hover:bg-[#8F3E1A] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {isImporting ? (
                                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                ) : (
                                  <DownloadCloud className="w-3 h-3 text-white" />
                                )}
                                <span>Import</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct ID Import Option */}
                <div className="pt-3 border-t border-[#E8E2D5]">
                  <label className="block text-[11px] font-bold text-[#7A7056] mb-1">
                    Or import directly by Meal ID:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualMealIdInput}
                      onChange={(e) => setManualMealIdInput(e.target.value)}
                      placeholder="e.g. 52771"
                      className="w-40 px-3 py-1.5 text-xs rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#B34E22]"
                    />
                    <button
                      type="button"
                      disabled={isImporting || !manualMealIdInput.trim()}
                      onClick={() => handleImportMealDb(manualMealIdInput)}
                      className="px-3 py-1.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] text-xs font-bold rounded-xl border border-[#E8E2D5] transition-colors cursor-pointer"
                    >
                      Import ID
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#FAF6ED] border-t border-[#E8E2D5] flex justify-end">
                <button
                  type="button"
                  onClick={closeImportModal}
                  className="px-5 py-2 text-xs font-bold border border-[#E8E2D5] rounded-xl text-[#504932] hover:bg-[#E8DFC9] cursor-pointer"
                >
                  Done
                </button>
              </div>
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
                    className="px-5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border border-[#E8E2D5] transition-all cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRecipe}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
                  >
                    {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
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
