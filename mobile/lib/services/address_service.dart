import '../config/api_config.dart';
import '../models/address_model.dart';
import 'api_client.dart';

class AddressService {
  static Future<ApiResponse<List<AddressModel>>> getAddresses() async {
    final response = await ApiClient.get(
      ApiConfig.addresses,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['addresses'] as List<dynamic>? ?? [];
      final addresses = rawList
          .map((a) => AddressModel.fromJson(a as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(addresses, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<AddressModel>> createAddress({
    required String label,
    required String addressLine1,
    String? addressLine2,
    String? landmark,
    required String city,
    required String state,
    required String postalCode,
    bool isDefault = false,
  }) async {
    final body = {
      'label': label,
      'addressLine1': addressLine1,
      if (addressLine2 != null && addressLine2.isNotEmpty) 'addressLine2': addressLine2,
      if (landmark != null && landmark.isNotEmpty) 'landmark': landmark,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'isDefault': isDefault,
    };

    final response = await ApiClient.post(
      ApiConfig.addresses,
      body: body,
      requireAuth: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final addressJson = data['address'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        AddressModel.fromJson(addressJson),
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
