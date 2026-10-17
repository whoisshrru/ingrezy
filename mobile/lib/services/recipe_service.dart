import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/product_model.dart';
import '../models/recipe_model.dart';
import 'api_client.dart';

class RecipeService {
  static Future<ApiResponse<List<RecipeModel>>> getRecipes({
    String? search,
    String? dietaryType,
    String? cuisine,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (dietaryType != null && dietaryType.trim().isNotEmpty && dietaryType != 'ALL')
        'dietaryType': dietaryType.trim(),
      if (cuisine != null && cuisine.trim().isNotEmpty && cuisine.trim().toLowerCase() != 'all')
        'cuisine': cuisine.trim(),
    };

    final response = await ApiClient.get(
      ApiConfig.recipes,
      queryParams: queryParams,
      requireAuth: false,
    );

    List<RecipeModel> recipes = [];
    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['recipes'] as List<dynamic>? ?? [];
      recipes = rawList
          .map((r) => RecipeModel.fromJson(r as Map<String, dynamic>))
          .toList();
    }

    // If search was specified and is a TheMealDB numeric ID (e.g. 52771) or returned no catalog matches:
    if (search != null && search.trim().isNotEmpty) {
      final cleanSearch = search.trim();
      final isNumeric = RegExp(r'^\d+$').hasMatch(cleanSearch);

      if (isNumeric) {
        if (!recipes.any((r) => r.id == cleanSearch)) {
          final mealRes = await getMealDbRecipeById(cleanSearch);
          if (mealRes.isSuccess && mealRes.data != null) {
            recipes.insert(0, mealRes.data!);
          }
        }
      } else if (recipes.isEmpty) {
        var externalList = await searchMealDb(cleanSearch);
        if (dietaryType != null && dietaryType.trim().isNotEmpty && dietaryType != 'ALL') {
          final targetDiet = DietaryType.fromString(dietaryType);
          externalList = externalList.where((r) => r.dietaryType == targetDiet).toList();
        }
        if (cuisine != null && cuisine.trim().isNotEmpty && cuisine.trim().toLowerCase() != 'all') {
          final targetCuisine = cuisine.trim().toLowerCase();
          externalList = externalList.where((r) => r.cuisine.trim().toLowerCase() == targetCuisine).toList();
        }
        recipes.addAll(externalList);
      }
    }

    if (recipes.isNotEmpty || response.isSuccess) {
      return ApiResponse.success(recipes, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<RecipeModel>> getRecipeById(
    String id, {
    int? servings,
  }) async {
    final cleanId = id.trim();
    final isExplicitMealDb = cleanId.startsWith('meal-') ||
        cleanId.startsWith('ext-') ||
        cleanId.startsWith('themealdb:');
    final isNumeric = RegExp(r'^\d+$').hasMatch(cleanId);
    final mealId = isExplicitMealDb
        ? cleanId
            .replaceFirst('meal-', '')
            .replaceFirst('ext-', '')
            .replaceFirst('themealdb:', '')
        : cleanId;

    final queryParams = <String, String>{
      if (servings != null) 'servings': servings.toString(),
    };

    // 1. Query backend API first. The backend handles database UUIDs, slugs,
    // and automatically imports / maps TheMealDB recipes if given a numeric or external ID.
    final response = await ApiClient.get(
      '${ApiConfig.recipes}/$cleanId',
      queryParams: queryParams,
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final recipeJson = data['recipe'] as Map<String, dynamic>? ?? data;
      if (data['ingredients'] != null && recipeJson['ingredients'] == null) {
        recipeJson['ingredients'] = data['ingredients'];
      }
      if (data['requestedServings'] != null) {
        recipeJson['requestedServings'] = data['requestedServings'];
      }
      return ApiResponse.success(
        RecipeModel.fromJson(recipeJson),
        message: response.message,
      );
    }

    // 2. Fallback: If backend is unreachable or returns 404, and ID is a TheMealDB meal,
    // fetch directly from TheMealDB client-side.
    if (isExplicitMealDb || (isNumeric && mealId.length >= 4 && mealId.length <= 6)) {
      final mealDbRes = await getMealDbRecipeById(mealId);
      if (mealDbRes.isSuccess) {
        return mealDbRes;
      }
    }

    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  /// Explicitly import a recipe from TheMealDB via backend API
  static Future<ApiResponse<RecipeModel>> importMealDbRecipe(String mealId) async {
    final cleanId = mealId.trim()
        .replaceFirst('meal-', '')
        .replaceFirst('ext-', '')
        .replaceFirst('themealdb:', '');

    final response = await ApiClient.post(
      '${ApiConfig.recipes}/import/themealdb/$cleanId',
      body: {},
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final recipeJson = data['recipe'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        RecipeModel.fromJson(recipeJson),
        message: response.message,
      );
    }

    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  /// Direct lookup from TheMealDB public recipe API
  static Future<ApiResponse<RecipeModel>> getMealDbRecipeById(String mealId) async {
    try {
      final cleanId = mealId.trim();
      final uri = Uri.parse('https://www.themealdb.com/api/json/v1/1/lookup.php?i=$cleanId');
      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic> && data['meals'] != null) {
          final meals = data['meals'] as List<dynamic>?;
          if (meals != null && meals.isNotEmpty && meals.first is Map<String, dynamic>) {
            final recipe = RecipeModel.fromJson(meals.first as Map<String, dynamic>);
            return ApiResponse.success(recipe);
          }
        }
        return ApiResponse.failure('Recipe not found in TheMealDB', statusCode: 404);
      }
      return ApiResponse.failure(
        'TheMealDB request failed (${response.statusCode})',
        statusCode: response.statusCode,
      );
    } catch (e) {
      return ApiResponse.failure('Failed to fetch from TheMealDB: $e');
    }
  }

  /// Search TheMealDB by recipe name keyword
  static Future<List<RecipeModel>> searchMealDb(String query) async {
    try {
      final uri = Uri.parse(
        'https://www.themealdb.com/api/json/v1/1/search.php?s=${Uri.encodeComponent(query)}',
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 12));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic> && data['meals'] != null) {
          final meals = data['meals'] as List<dynamic>;
          return meals
              .whereType<Map<String, dynamic>>()
              .map((m) => RecipeModel.fromJson(m))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }
}
