import 'product_model.dart';
import 'recipe_model.dart';

/// Typed adapter that converts TheMealDB API responses into normalized Ingrezy models.
/// Preserves exact measurement strings (e.g. "1 pound", "1/4 cup", "sprinkling") without
/// inventing fake numeric quantities, units, product IDs, prices, or stock.
class TheMealDbAdapter {
  /// Checks whether the given JSON map conforms to TheMealDB meal payload structure.
  static bool isMealDbJson(Map<String, dynamic> json) {
    if (json.containsKey('meals') && json['meals'] is List) {
      return true;
    }
    if (json.containsKey('idMeal') || json.containsKey('strMealThumb') || json.containsKey('strArea')) {
      return true;
    }
    for (int i = 1; i <= 20; i++) {
      if (json.containsKey('strIngredient$i')) return true;
    }
    // Also if strMeal is present and ingredients list is absent
    if (json.containsKey('strMeal') &&
        (json['ingredients'] == null ||
            (json['ingredients'] is List && (json['ingredients'] as List).isEmpty))) {
      return true;
    }
    return false;
  }

  /// Converts TheMealDB `strIngredient1..20` and `strMeasure1..20` into a normalized `List<RecipeIngredientModel>`.
  ///
  /// Safe conversion rules:
  /// - Skips null, empty, or whitespace-only ingredients.
  /// - Skips literal string 'null'.
  /// - Preserves exact measurement text verbatim (e.g. "1 pound", "1/4 cup", "sprinkling", "to taste").
  /// - Does NOT invent numeric quantities or units.
  /// - Sets `productId: ''` and `product: null` (no fake product IDs, prices, or stock matches).
  static List<RecipeIngredientModel> parseIngredients(Map<String, dynamic> mealJson) {
    final List<RecipeIngredientModel> ingredients = [];
    final mealId = mealJson['idMeal']?.toString() ?? 'ext';

    int i = 1;
    while (true) {
      final ingKey = 'strIngredient$i';
      final measKey = 'strMeasure$i';

      // TheMealDB provides up to 20 by default; also support dynamic extended keys if present
      if (!mealJson.containsKey(ingKey) && i > 20) {
        break;
      }

      final rawIngredient = mealJson[ingKey];
      final rawMeasure = mealJson[measKey];
      i++;

      // Check if ingredient exists and is not blank
      if (rawIngredient == null) continue;
      final ingredientName = rawIngredient.toString().trim();
      if (ingredientName.isEmpty || ingredientName.toLowerCase() == 'null') {
        continue;
      }

      // Preserve exact measurement text without inventing numbers or units
      String? cleanMeasure;
      if (rawMeasure != null) {
        final measureStr = rawMeasure.toString().trim();
        if (measureStr.isNotEmpty && measureStr.toLowerCase() != 'null') {
          cleanMeasure = measureStr;
        }
      }

      ingredients.add(
        RecipeIngredientModel(
          id: 'ext-$mealId-${i - 1}',
          productId: '', // No fake productId
          name: ingredientName,
          quantity: 0.0, // No invented numeric quantity
          baseQuantity: 0.0,
          unit: '', // No invented unit
          isMandatory: true,
          notes: null,
          product: null, // No fake product matches
          rawMeasure: cleanMeasure, // Preserves exact original text
        ),
      );
    }

    return ingredients;
  }

  /// Converts a single TheMealDB meal JSON object into a full RecipeModel.
  static RecipeModel toRecipeModel(Map<String, dynamic> rawJson) {
    Map<String, dynamic> mealJson = rawJson;
    if (rawJson.containsKey('meals') && rawJson['meals'] is List) {
      final list = rawJson['meals'] as List;
      if (list.isNotEmpty && list.first is Map<String, dynamic>) {
        mealJson = list.first as Map<String, dynamic>;
      }
    }

    final id = (mealJson['idMeal'] ?? mealJson['id'] ?? '').toString().trim();
    final title = (mealJson['strMeal'] ?? mealJson['title'] ?? 'Untitled Recipe').toString().trim();
    final instructions = (mealJson['strInstructions'] ?? mealJson['instructions'] ?? '').toString().trim();
    final imageUrl = mealJson['strMealThumb']?.toString() ?? mealJson['imageUrl']?.toString();
    final category = mealJson['strCategory']?.toString().trim();
    final area = mealJson['strArea']?.toString().trim();

    // Map cuisine and dietary type intelligently without inventing fake database models
    final cuisine = (area != null && area.isNotEmpty && area.toLowerCase() != 'unknown')
        ? area
        : (mealJson['cuisine']?.toString() ?? 'International');

    DietaryType dietary = DietaryType.VEG;
    if (category != null && category.isNotEmpty) {
      final lowerCat = category.toLowerCase();
      if (lowerCat.contains('chicken') ||
          lowerCat.contains('beef') ||
          lowerCat.contains('pork') ||
          lowerCat.contains('meat') ||
          lowerCat.contains('seafood') ||
          lowerCat.contains('lamb') ||
          lowerCat.contains('goat')) {
        dietary = DietaryType.NON_VEG;
      }
    } else if (mealJson['dietaryType'] != null) {
      dietary = DietaryType.fromString(mealJson['dietaryType'] as String?);
    }

    final ingredients = parseIngredients(mealJson);

    final rawMealId = (mealJson['idMeal'] ?? '').toString().trim();
    final externalId = rawMealId.isNotEmpty ? 'themealdb:$rawMealId' : null;

    return RecipeModel(
      id: id,
      externalId: externalId,
      source: 'THEMEALDB',
      title: title,
      slug: _slugify(title),
      description: (category != null && category.isNotEmpty)
          ? '$category dish${area != null && area.isNotEmpty ? " ($area cuisine)" : ""}'
          : mealJson['description']?.toString(),
      prepTimeMinutes: (mealJson['prepTimeMinutes'] as num?)?.toInt() ?? 15,
      cookTimeMinutes: (mealJson['cookTimeMinutes'] as num?)?.toInt() ?? 25,
      servings: (mealJson['servings'] as num?)?.toInt() ?? 2,
      baseServings: (mealJson['baseServings'] as num?)?.toInt() ?? 2,
      difficulty: mealJson['difficulty']?.toString() ?? 'MEDIUM',
      dietaryType: dietary,
      cuisine: cuisine,
      instructions: instructions,
      imageUrl: imageUrl,
      ingredients: ingredients,
    );
  }

  /// Parses a TheMealDB search or filter result payload containing a list of meals.
  static List<RecipeModel> parseMealList(Map<String, dynamic> json) {
    if (!json.containsKey('meals') || json['meals'] == null) {
      return [];
    }
    final meals = json['meals'] as List<dynamic>;
    return meals
        .whereType<Map<String, dynamic>>()
        .map((m) => toRecipeModel(m))
        .toList();
  }

  static String _slugify(String text) {
    return text
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^\w\s-]'), '')
        .replaceAll(RegExp(r'[\s_-]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
  }
}
