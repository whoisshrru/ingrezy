import '../config/api_config.dart';
import '../models/delivery_model.dart';
import 'api_client.dart';

class DeliveryService {
  static Future<ApiResponse<Map<String, dynamic>>> getProfile() async {
    final response = await ApiClient.get(
      ApiConfig.deliveryProfile,
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

  static Future<ApiResponse<List<DeliveryModel>>> getAssignments() async {
    final response = await ApiClient.get(
      ApiConfig.deliveryAssignments,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['deliveries'] as List<dynamic>? ??
          data['assignments'] as List<dynamic>? ??
          [];
      final deliveries = rawList
          .map((d) => DeliveryModel.fromJson(d as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(deliveries, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<DeliveryModel>> acceptAssignment(String deliveryId) async {
    final response = await ApiClient.patch(
      '${ApiConfig.deliveryAssignments}/$deliveryId/accept',
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final deliveryJson = data['delivery'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        DeliveryModel.fromJson(deliveryJson),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<DeliveryModel>> pickupDelivery(String deliveryId) async {
    final response = await ApiClient.patch(
      '${ApiConfig.deliveryAssignments}/$deliveryId/pickup',
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final deliveryJson = data['delivery'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        DeliveryModel.fromJson(deliveryJson),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<DeliveryModel>> completeDeliveryWithOtp({
    required String deliveryId,
    required String otp,
  }) async {
    final response = await ApiClient.post(
      '${ApiConfig.deliveryAssignments}/$deliveryId/complete',
      body: {'otp': otp.trim()},
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final deliveryJson = data['delivery'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        DeliveryModel.fromJson(deliveryJson),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<bool>> updateLiveLocation({
    required double latitude,
    required double longitude,
  }) async {
    final response = await ApiClient.patch(
      ApiConfig.deliveryLocation,
      body: {
        'latitude': latitude,
        'longitude': longitude,
      },
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
}
