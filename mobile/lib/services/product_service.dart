import '../config/api_config.dart';
import '../models/product_model.dart';
import 'api_client.dart';

class ProductService {
  static Future<ApiResponse<List<ProductModel>>> getProducts({
    String? search,
    String? category,
    String? dietaryType,
    int page = 1,
    int limit = 40,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (category != null && category.trim().isNotEmpty && category != 'All')
        'category': category.trim(),
      if (dietaryType != null && dietaryType.trim().isNotEmpty && dietaryType != 'ALL')
        'dietaryType': dietaryType.trim(),
    };

    final response = await ApiClient.get(
      ApiConfig.products,
      queryParams: queryParams,
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['products'] as List<dynamic>? ?? [];
      final products = rawList
          .map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(products, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<ProductModel>> getProductById(String id) async {
    final response = await ApiClient.get(
      '${ApiConfig.products}/$id',
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final productJson = data['product'] as Map<String, dynamic>? ?? data;
      return ApiResponse.success(
        ProductModel.fromJson(productJson),
        message: response.message,
      );
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<List<Map<String, dynamic>>>> getStores() async {
    final response = await ApiClient.get(
      ApiConfig.stores,
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final rawList = data['stores'] as List<dynamic>? ?? [];
      final stores = rawList.cast<Map<String, dynamic>>();
      return ApiResponse.success(stores, message: response.message);
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
      queryParams: {'limit': '100'},
      requireAuth: false,
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
}
