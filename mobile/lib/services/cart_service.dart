import '../config/api_config.dart';
import '../models/cart_model.dart';
import 'api_client.dart';

class CartService {
  static Future<ApiResponse<CartModel>> getCart({String? storeId}) async {
    final queryParams = <String, String>{
      if (storeId != null && storeId.isNotEmpty) 'storeId': storeId,
    };

    final response = await ApiClient.get(
      ApiConfig.cart,
      queryParams: queryParams,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(
        CartModel.fromJson(data),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<CartModel>> addItem({
    required String productId,
    required String storeId,
    int quantity = 1,
    bool clearPrevious = false,
  }) async {
    final body = {
      'productId': productId,
      'storeId': storeId,
      'quantity': quantity,
      'clearPrevious': clearPrevious,
    };

    final response = await ApiClient.post(
      '${ApiConfig.cart}/items',
      body: body,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(
        CartModel.fromJson(data),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<CartModel>> updateItemQuantity({
    required String itemId,
    required int quantity,
  }) async {
    final response = await ApiClient.patch(
      '${ApiConfig.cart}/items/$itemId',
      body: {'quantity': quantity},
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(
        CartModel.fromJson(data),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<CartModel>> removeItem(String itemId) async {
    final response = await ApiClient.delete(
      '${ApiConfig.cart}/items/$itemId',
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(
        CartModel.fromJson(data),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<bool>> clearCart() async {
    final response = await ApiClient.delete(
      ApiConfig.cart,
      requireAuth: true,
    );

    if (response.isSuccess) {
      return ApiResponse.success(true, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<Map<String, dynamic>>> bundleRecipe({
    required String recipeId,
    required String storeId,
    int? servings,
    bool clearPrevious = false,
    List<String>? excludeProductIds,
    List<String>? excludeIngredientIds,
  }) async {
    final body = {
      'storeId': storeId,
      if (servings != null) 'servings': servings,
      'clearPrevious': clearPrevious,
      if (excludeProductIds != null && excludeProductIds.isNotEmpty)
        'excludeProductIds': excludeProductIds,
      if (excludeIngredientIds != null && excludeIngredientIds.isNotEmpty)
        'excludeIngredientIds': excludeIngredientIds,
    };

    final response = await ApiClient.post(
      '${ApiConfig.cart}/recipes/$recipeId',
      body: body,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(
        data,
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }
}
