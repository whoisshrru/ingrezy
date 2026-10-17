import 'product_model.dart';
import 'themealdb_adapter.dart';

class RecipeIngredientModel {
  final String id;
  final String productId;
  final String name;
  final double quantity; // current scaled quantity
  final double baseQuantity; // base recipe quantity
  final String unit;
  final bool isMandatory;
  final String? notes;
  final ProductModel? product;
  final String? rawMeasure;

  RecipeIngredientModel({
    required this.id,
    required this.productId,
    required this.name,
    required this.quantity,
    required this.baseQuantity,
    required this.unit,
    this.isMandatory = true,
    this.notes,
    this.product,
    this.rawMeasure,
  });

  bool get hasLinkedProduct => productId.trim().isNotEmpty;

  String get formattedQuantity {
    if (rawMeasure != null && rawMeasure!.trim().isNotEmpty) {
      return rawMeasure!.trim();
    }
    if (quantity == 0 && unit.trim().isEmpty) {
      return '';
    }
    if (quantity == quantity.roundToDouble()) {
      return '${quantity.toInt()} $unit'.trim();
    } else {
      final formatted = quantity.toStringAsFixed(
        (quantity * 10).truncateToDouble() == quantity * 10 ? 1 : 2,
      );
      return '$formatted $unit'.trim();
    }
  }

  RecipeIngredientModel copyWith({
    String? id,
    String? productId,
    String? name,
    double? quantity,
    double? baseQuantity,
    String? unit,
    bool? isMandatory,
    String? notes,
    ProductModel? product,
    String? rawMeasure,
  }) {
    return RecipeIngredientModel(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      baseQuantity: baseQuantity ?? this.baseQuantity,
      unit: unit ?? this.unit,
      isMandatory: isMandatory ?? this.isMandatory,
      notes: notes ?? this.notes,
      product: product ?? this.product,
      rawMeasure: rawMeasure ?? this.rawMeasure,
    );
  }

  factory RecipeIngredientModel.fromJson(Map<String, dynamic> json) {
    double parseQty(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    final rawScaled = json['scaledQuantity'] ?? json['quantity'] ?? json['baseQuantity'];
    final rawBase = json['baseQuantity'] ?? json['quantity'] ?? json['scaledQuantity'];

    ProductModel? prod;
    if (json['product'] != null && json['product'] is Map<String, dynamic>) {
      prod = ProductModel.fromJson(json['product'] as Map<String, dynamic>);
    }

    final resolvedName = json['name'] as String? ??
        json['productName'] as String? ??
        prod?.name ??
        'Ingredient';

    final rawMeasureVal = json['rawMeasure'] as String? ??
        json['measure'] as String? ??
        json['strMeasure'] as String?;

    return RecipeIngredientModel(
      id: json['id'] as String? ?? '',
      productId: json['productId'] as String? ?? (prod?.id ?? ''),
      name: resolvedName,
      quantity: parseQty(rawScaled),
      baseQuantity: parseQty(rawBase),
      unit: json['unit'] as String? ?? (prod?.unit ?? ''),
      isMandatory: json['isMandatory'] as bool? ?? true,
      notes: json['notes'] as String?,
      product: prod,
      rawMeasure: rawMeasureVal != null &&
              rawMeasureVal.trim().isNotEmpty &&
              rawMeasureVal.trim().toLowerCase() != 'null'
          ? rawMeasureVal.trim()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'quantity': quantity,
      'baseQuantity': baseQuantity,
      'unit': unit,
      'isMandatory': isMandatory,
      'notes': notes,
      if (rawMeasure != null) 'rawMeasure': rawMeasure,
      if (product != null) 'product': product!.toJson(),
    };
  }
}

class RecipeModel {
  final String id;
  final String? externalId;
  final String? source;
  final String title;
  final String slug;
  final String? description;
  final int prepTimeMinutes;
  final int cookTimeMinutes;
  final int servings;
  final int baseServings;
  final String difficulty;
  final DietaryType dietaryType;
  final String cuisine;
  final String instructions;
  final String? imageUrl;
  final List<RecipeIngredientModel> ingredients;

  RecipeModel({
    required this.id,
    this.externalId,
    this.source,
    required this.title,
    required this.slug,
    this.description,
    required this.prepTimeMinutes,
    required this.cookTimeMinutes,
    required this.servings,
    required this.baseServings,
    required this.difficulty,
    this.dietaryType = DietaryType.VEG,
    this.cuisine = 'Indian',
    required this.instructions,
    this.imageUrl,
    this.ingredients = const [],
  });

  int get totalTimeMinutes => prepTimeMinutes + cookTimeMinutes;

  RecipeModel withServings(int newServings) {
    final scale = baseServings > 0 ? (newServings / baseServings) : 1.0;
    final updatedIngredients = ingredients.map((ing) {
      if (ing.rawMeasure != null && ing.rawMeasure!.trim().isNotEmpty) {
        // Preserve original measurement text exactly; do not invent numeric quantities or units
        return ing;
      }
      final newScaled = MathHelper.round2(ing.baseQuantity * scale);
      return ing.copyWith(quantity: newScaled);
    }).toList();

    return RecipeModel(
      id: id,
      externalId: externalId,
      source: source,
      title: title,
      slug: slug,
      description: description,
      prepTimeMinutes: prepTimeMinutes,
      cookTimeMinutes: cookTimeMinutes,
      servings: newServings,
      baseServings: baseServings,
      difficulty: difficulty,
      dietaryType: dietaryType,
      cuisine: cuisine,
      instructions: instructions,
      imageUrl: imageUrl,
      ingredients: updatedIngredients,
    );
  }

  factory RecipeModel.fromJson(Map<String, dynamic> json) {
    if (TheMealDbAdapter.isMealDbJson(json)) {
      return TheMealDbAdapter.toRecipeModel(json);
    }

    var rawIngredients = json['ingredients'] as List<dynamic>? ?? [];
    List<RecipeIngredientModel> ingredientsList = rawIngredients
        .map((i) => RecipeIngredientModel.fromJson(i as Map<String, dynamic>))
        .toList();

    final base = (json['baseServings'] as num?)?.toInt() ??
        (json['servings'] as num?)?.toInt() ??
        2;
    final active = (json['activeServings'] as num?)?.toInt() ??
        (json['servings'] as num?)?.toInt() ??
        base;

    final rawArea = json['strArea'] as String? ?? json['area'] as String?;
    final resolvedCuisine = json['cuisine'] as String? ??
        (rawArea != null && rawArea.trim().isNotEmpty && rawArea.trim().toLowerCase() != 'unknown'
            ? rawArea.trim()
            : 'International');

    return RecipeModel(
      id: (json['id'] ?? json['idMeal'] ?? '').toString(),
      externalId: json['externalId'] as String?,
      source: json['source'] as String?,
      title: json['title'] as String? ?? json['strMeal'] as String? ?? 'Untitled Recipe',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      prepTimeMinutes: (json['prepTimeMinutes'] as num?)?.toInt() ?? 10,
      cookTimeMinutes: (json['cookTimeMinutes'] as num?)?.toInt() ?? 20,
      servings: active,
      baseServings: base,
      difficulty: json['difficulty'] as String? ?? 'EASY',
      dietaryType: DietaryType.fromString(
        json['dietaryType'] as String? ?? json['strCategory'] as String?,
      ),
      cuisine: resolvedCuisine,
      instructions: json['instructions'] as String? ?? json['strInstructions'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? json['strMealThumb'] as String? ?? json['image'] as String?,
      ingredients: ingredientsList,
    );
  }
}

class MathHelper {
  static double round2(double val) {
    return (val * 100).round() / 100;
  }
}
