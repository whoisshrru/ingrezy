import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  static const String _userKey = 'ingrezy_cached_user';

  static Future<ApiResponse<UserModel>> login({
    required String identifier,
    required String password,
  }) async {
    final response = await ApiClient.post(
      ApiConfig.authLogin,
      body: {
        'identifier': identifier.trim(),
        'password': password,
      },
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String?;
      final userJson = data['user'] as Map<String, dynamic>?;

      if (token != null) {
        await ApiClient.saveToken(token);
      }
      if (userJson != null) {
        final user = UserModel.fromJson(userJson);
        await _saveCachedUser(user);
        return ApiResponse.success(user, message: response.message);
      }
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<UserModel>> register({
    required String name,
    required String phoneNumber,
    required String password,
    String? email,
    required UserRole role,
  }) async {
    final body = {
      'name': name.trim(),
      'phoneNumber': phoneNumber.trim(),
      'password': password,
      'role': role.name,
      if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
    };

    final response = await ApiClient.post(
      ApiConfig.authRegister,
      body: body,
      requireAuth: false,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String?;
      final userJson = data['user'] as Map<String, dynamic>?;

      if (token != null) {
        await ApiClient.saveToken(token);
      }
      if (userJson != null) {
        final user = UserModel.fromJson(userJson);
        await _saveCachedUser(user);
        return ApiResponse.success(user, message: response.message);
      }
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<ApiResponse<UserModel>> getProfile() async {
    final response = await ApiClient.get(ApiConfig.authProfile);

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final userJson = data['user'] as Map<String, dynamic>? ?? data;
      final user = UserModel.fromJson(userJson);
      await _saveCachedUser(user);
      return ApiResponse.success(user, message: response.message);
    }
    return ApiResponse.failure(
      response.message,
      errors: response.errors,
      statusCode: response.statusCode,
    );
  }

  static Future<void> logout() async {
    await ApiClient.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  static Future<UserModel?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw != null) {
      try {
        final map = jsonDecode(raw) as Map<String, dynamic>;
        return UserModel.fromJson(map);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  static Future<void> _saveCachedUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }
}
