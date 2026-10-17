import 'package:flutter/material.dart';
import '../models/cart_model.dart';
import '../services/cart_service.dart';

class CartProvider extends ChangeNotifier {
  CartModel? _cart;
  bool _isLoading = false;
  String? _errorMessage;

  CartModel? get cart => _cart;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get itemCount => _cart?.totalItemCount ?? 0;
  bool get isEmpty => _cart == null || _cart!.items.isEmpty;
  bool get hasItems => !isEmpty;

  Future<void> loadCart({String? storeId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final targetStoreId = storeId ?? _cart?.storeId;
    final response = await CartService.getCart(storeId: targetStoreId);
    _isLoading = false;

    if (response.isSuccess && response.data != null) {
      _cart = response.data;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  Future<bool> addItem({
    required String productId,
    required String storeId,
    int quantity = 1,
    bool clearPrevious = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await CartService.addItem(
      productId: productId,
      storeId: storeId,
      quantity: quantity,
      clearPrevious: clearPrevious,
    );

    if (response.isSuccess) {
      // Refresh the full cart state from the backend
      final fullCartRes = await CartService.getCart(storeId: storeId);
      _isLoading = false;
      if (fullCartRes.isSuccess && fullCartRes.data != null) {
        _cart = fullCartRes.data;
        _errorMessage = null;
      } else if (response.data != null) {
        _cart = response.data;
        _errorMessage = null;
      }
      notifyListeners();
      return true;
    } else {
      _isLoading = false;
      _errorMessage = response.message;
      if (response.errors.isNotEmpty) {
        _errorMessage = '$_errorMessage: ${response.errors.join(", ")}';
      }
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateQuantity({
    required String itemId,
    required int quantity,
    String? storeId,
  }) async {
    if (quantity <= 0) {
      return removeItem(itemId, storeId: storeId);
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await CartService.updateItemQuantity(
      itemId: itemId,
      quantity: quantity,
    );

    if (response.isSuccess) {
      final targetStore = storeId ?? _cart?.storeId;
      final fullCartRes = await CartService.getCart(storeId: targetStore);
      _isLoading = false;
      if (fullCartRes.isSuccess && fullCartRes.data != null) {
        _cart = fullCartRes.data;
        _errorMessage = null;
      }
      notifyListeners();
      return true;
    } else {
      _isLoading = false;
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> removeItem(String itemId, {String? storeId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await CartService.removeItem(itemId);
    if (response.isSuccess) {
      final targetStore = storeId ?? _cart?.storeId;
      final fullCartRes = await CartService.getCart(storeId: targetStore);
      _isLoading = false;
      if (fullCartRes.isSuccess && fullCartRes.data != null) {
        _cart = fullCartRes.data;
        _errorMessage = null;
      } else {
        _cart = null;
        _errorMessage = null;
      }
      notifyListeners();
      return true;
    } else {
      _isLoading = false;
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> clearCart() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await CartService.clearCart();
    _isLoading = false;

    if (response.isSuccess) {
      _cart = null;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _errorMessage = response.message;
      notifyListeners();
      return false;
    }
  }

  Map<String, dynamic>? _lastBundleResult;
  Map<String, dynamic>? get lastBundleResult => _lastBundleResult;

  Future<bool> bundleRecipe({
    required String recipeId,
    required String storeId,
    int? servings,
    bool clearPrevious = false,
    List<String>? excludeProductIds,
    List<String>? excludeIngredientIds,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _lastBundleResult = null;
    notifyListeners();

    final response = await CartService.bundleRecipe(
      recipeId: recipeId,
      storeId: storeId,
      servings: servings,
      clearPrevious: clearPrevious,
      excludeProductIds: excludeProductIds,
      excludeIngredientIds: excludeIngredientIds,
    );

    if (response.isSuccess) {
      _lastBundleResult = response.data;
      final fullCartRes = await CartService.getCart(storeId: storeId);
      _isLoading = false;
      if (fullCartRes.isSuccess && fullCartRes.data != null) {
        _cart = fullCartRes.data;
        _errorMessage = null;
      }
      notifyListeners();
      return true;
    } else {
      _isLoading = false;
      _errorMessage = response.message;
      if (response.errors.isNotEmpty) {
        _errorMessage = '$_errorMessage: ${response.errors.join(", ")}';
      }
      notifyListeners();
      return false;
    }
  }

  int getProductQuantityInCart(String productId) {
    if (_cart == null) return 0;
    for (var item in _cart!.items) {
      if (item.productId == productId) {
        return item.quantity;
      }
    }
    return 0;
  }
}
