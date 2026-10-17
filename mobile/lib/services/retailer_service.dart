import '../config/api_config.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import 'api_client.dart';

class RetailerService {
  static Future<ApiResponse<Map<String, dynamic>>> getStoreProfile() async {
    final response = await ApiClient.get(
      ApiConfig.retailerStore,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final store = data['store'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(store, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<List<ProductModel>>> getStoreInventory(String storeId) async {
    final response = await ApiClient.get(
      '${ApiConfig.stores}/$storeId/inventory',
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['inventory'] as List<dynamic>? ?? [];

      final products = rawList.map((item) {
        final p = item['product'] as Map<String, dynamic>;
        final merged = Map<String, dynamic>.from(p);
        merged['stockQuantity'] = item['stockQuantity'];
        merged['price'] = item['price'];
        merged['isAvailable'] = item['isAvailable'];
        return ProductModel.fromJson(merged);
      }).toList();

      return ApiResponse.success(products, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<bool>> updateInventoryStock({
    required String storeId,
    required String productId,
    int? stockQuantity,
    double? price,
    bool? isAvailable,
  }) async {
    final body = <String, dynamic>{
      if (stockQuantity != null) 'stockQuantity': stockQuantity,
      if (price != null) 'price': price,
      if (isAvailable != null) 'isAvailable': isAvailable,
    };

    final response = await ApiClient.patch(
      '${ApiConfig.stores}/$storeId/inventory/$productId',
      body: body,
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

  static Future<ApiResponse<List<OrderModel>>> getRetailerOrders({String? status}) async {
    final queryParams = <String, String>{
      if (status != null && status.isNotEmpty) 'status': status,
    };

    final response = await ApiClient.get(
      ApiConfig.retailerOrders,
      queryParams: queryParams,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['orders'] as List<dynamic>? ?? [];
      final orders = rawList
          .map((o) => OrderModel.fromJson(o as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(orders, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<OrderModel>> updateOrderStatus({
    required String orderId,
    required String status,
  }) async {
    final response = await ApiClient.patch(
      '${ApiConfig.retailerOrders}/$orderId/status',
      body: {'status': status},
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final orderJson = data['order'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        OrderModel.fromJson(orderJson),
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
