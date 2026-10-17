"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import { BookOpen, Clock, Users, RefreshCw, AlertCircle } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  slug: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietaryType: string;
  difficulty: string;
  imageUrl: string | null;
  isActive: boolean;
  author?: {
    name: string;
  } | null;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient<{ recipes: Recipe[] }>("/api/recipes?limit=50");
    if (res.success && res.data) {
      setRecipes(res.data.recipes);
    } else {
      setError(res.message || "Failed to load recipes");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Smart Recipes Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cuisine library, automated ingredient scaling, and quick-commerce recipe bundling
            </p>
          </div>

          <button
            onClick={fetchRecipes}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Recipes</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">Loading recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">No recipes found.</div>
          ) : (
            recipes.map((r) => (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700 transition-all group"
              >
                <div className="h-44 bg-slate-800 relative overflow-hidden">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white border border-white/10 uppercase tracking-wide">
                      {r.cuisine}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-xs text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {r.dietaryType}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-sm text-white line-clamp-1">{r.title}</h3>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.prepTimeMinutes + r.cookTimeMinutes}m total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.servings} Servings</span>
                    </div>
                    <div className="text-right font-semibold text-amber-400">{r.difficulty}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
