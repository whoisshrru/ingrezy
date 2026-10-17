enum DietaryType {
  VEG,
  NON_VEG,
  VEGAN,
  CONTAINS_EGG;

  static DietaryType fromString(String? type) {
    switch (type?.toUpperCase()) {
      case 'NON_VEG':
        return DietaryType.NON_VEG;
      case 'VEGAN':
        return DietaryType.VEGAN;
      case 'CONTAINS_EGG':
        return DietaryType.CONTAINS_EGG;
      case 'VEG':
      default:
        return DietaryType.VEG;
    }
  }

  String toDisplayString() {
    switch (this) {
      case DietaryType.VEG:
        return 'Veg';
      case DietaryType.NON_VEG:
        return 'Non-Veg';
      case DietaryType.VEGAN:
        return 'Vegan';
      case DietaryType.CONTAINS_EGG:
        return 'Contains Egg';
    }
  }
}

class ProductModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String category;
  final String unit;
  final double basePrice;
  final String? imageUrl;
  final DietaryType dietaryType;
  final bool isActive;
  // If attached from store inventory
  final int? stockQuantity;
  final double? storePrice;
  final bool? isAvailable;

  ProductModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.category,
    required this.unit,
    required this.basePrice,
    this.imageUrl,
    this.dietaryType = DietaryType.VEG,
    this.isActive = true,
    this.stockQuantity,
    this.storePrice,
    this.isAvailable,
  });

  double get displayPrice => storePrice ?? basePrice;
  bool get inStock => (stockQuantity ?? 10) > 0 && (isAvailable ?? true);

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // basePrice or price could be string or num from PostgreSQL Decimal
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return ProductModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unnamed Product',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'General',
      unit: json['unit'] as String? ?? 'unit',
      basePrice: parsePrice(json['basePrice']),
      imageUrl: json['imageUrl'] as String?,
      dietaryType: DietaryType.fromString(json['dietaryType'] as String?),
      isActive: json['isActive'] as bool? ?? true,
      stockQuantity: json['stockQuantity'] as int?,
      storePrice: json['price'] != null ? parsePrice(json['price']) : null,
      isAvailable: json['isAvailable'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'category': category,
      'unit': unit,
      'basePrice': basePrice,
      'imageUrl': imageUrl,
      'dietaryType': dietaryType.name,
      'isActive': isActive,
      'stockQuantity': stockQuantity,
      'price': storePrice,
      'isAvailable': isAvailable,
    };
  }
}
