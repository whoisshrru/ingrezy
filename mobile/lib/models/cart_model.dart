import 'product_model.dart';

class CartItemModel {
  final String id;
  final String productId;
  int quantity;
  final ProductModel product;
  final double? unitPrice;
  final double? subtotal;

  CartItemModel({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.product,
    this.unitPrice,
    this.subtotal,
  });

  double get effectiveUnitPrice => unitPrice ?? product.basePrice;
  double get effectiveSubtotal => subtotal ?? (effectiveUnitPrice * quantity);

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    // Handles both nested product object (from prisma include)
    // and flattened fields (from GET /api/cart)
    ProductModel resolvedProduct;
    if (json['product'] != null && json['product'] is Map<String, dynamic>) {
      resolvedProduct = ProductModel.fromJson(json['product'] as Map<String, dynamic>);
    } else {
      resolvedProduct = ProductModel(
        id: json['productId'] as String? ?? json['id'] as String? ?? '',
        name: json['productName'] as String? ?? json['name'] as String? ?? 'Item',
        slug: json['slug'] as String? ?? '',
        category: json['category'] as String? ?? 'General',
        unit: json['unit'] as String? ?? 'unit',
        basePrice: parsePrice(json['unitPrice'] ?? json['basePrice']),
        imageUrl: json['imageUrl'] as String?,
        dietaryType: DietaryType.fromString(json['dietaryType'] as String?),
        stockQuantity: (json['availableStock'] as num?)?.toInt(),
        isAvailable: json['inStock'] as bool? ?? true,
      );
    }

    final pId = json['productId'] as String? ?? resolvedProduct.id;

    return CartItemModel(
      id: json['id'] as String? ?? '',
      productId: pId,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      product: resolvedProduct,
      unitPrice: json['unitPrice'] != null ? parsePrice(json['unitPrice']) : resolvedProduct.basePrice,
      subtotal: json['subtotal'] != null || json['itemSubtotal'] != null
          ? parsePrice(json['subtotal'] ?? json['itemSubtotal'])
          : null,
    );
  }
}

class CartModel {
  final String id;
  final String? storeId;
  final String? storeName;
  final List<CartItemModel> items;
  final double subtotal;
  final double deliveryFee;
  final double totalAmount;

  CartModel({
    required this.id,
    this.storeId,
    this.storeName,
    this.items = const [],
    this.subtotal = 0.0,
    this.deliveryFee = 0.0,
    this.totalAmount = 0.0,
  });

  int get totalItemCount => items.fold(0, (sum, item) => sum + item.quantity);

  factory CartModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    var cartObj = json['cart'] as Map<String, dynamic>? ?? json;
    var rawItems = json['items'] as List<dynamic>? ??
        cartObj['items'] as List<dynamic>? ??
        [];

    // If single cartItem was returned (e.g. from POST /items response)
    if (rawItems.isEmpty && json['cartItem'] != null && json['cartItem'] is Map<String, dynamic>) {
      rawItems = [json['cartItem']];
    }

    List<CartItemModel> itemsList = rawItems
        .map((e) => CartItemModel.fromJson(e as Map<String, dynamic>))
        .toList();

    var pricing = json['pricing'] as Map<String, dynamic>? ?? {};
    var store = json['store'] as Map<String, dynamic>?;

    double sub = parsePrice(pricing['subtotal']);
    if (sub == 0.0 && itemsList.isNotEmpty) {
      sub = itemsList.fold(0.0, (acc, item) => acc + item.effectiveSubtotal);
    }
    double fee;
    if (pricing['deliveryFee'] != null) {
      fee = parsePrice(pricing['deliveryFee']);
    } else {
      fee = (sub > 0 && sub < 500) ? 30.0 : 0.0;
    }
    double tot = parsePrice(pricing['totalAmount'] ?? pricing['total']);
    if (tot == 0.0) tot = sub + fee;

    final resolvedCartId = json['cartId'] as String? ?? cartObj['id'] as String? ?? '';
    final resolvedStoreId = store?['id'] as String? ?? cartObj['storeId'] as String?;
    final resolvedStoreName = store?['name'] as String?;

    return CartModel(
      id: resolvedCartId,
      storeId: resolvedStoreId,
      storeName: resolvedStoreName,
      items: itemsList,
      subtotal: sub,
      deliveryFee: fee,
      totalAmount: tot,
    );
  }
}
