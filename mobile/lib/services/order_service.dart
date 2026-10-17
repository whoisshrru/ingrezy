import '../config/api_config.dart';
import '../models/order_model.dart';
import 'api_client.dart';

class OrderService {
  static Future<ApiResponse<OrderModel>> checkout({
    required String addressId,
    String paymentMethod = 'COD',
    String? specialInstructions,
  }) async {
    final body = {
      'addressId': addressId,
      'paymentMethod': paymentMethod,
      if (specialInstructions != null && specialInstructions.isNotEmpty)
        'specialInstructions': specialInstructions,
    };

    final response = await ApiClient.post(
      '${ApiConfig.orders}/checkout',
      body: body,
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

  static Future<ApiResponse<List<OrderModel>>> getOrders() async {
    final response = await ApiClient.get(
      ApiConfig.orders,
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

  static Future<ApiResponse<OrderModel>> getOrderById(String orderId) async {
    final response = await ApiClient.get(
      '${ApiConfig.orders}/$orderId',
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

  static Future<ApiResponse<Map<String, dynamic>>> getDeliveryOtp(String orderId) async {
    final response = await ApiClient.get(
      '${ApiConfig.orders}/$orderId/delivery-otp',
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      return ApiResponse.success(data, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }
}
